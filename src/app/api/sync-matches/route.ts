import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  fetchKnockoutMatches,
  mapApiStatus,
  mapApiStage,
  getFinalScore,
} from '@/lib/football-api/client'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { scoreMatchPicks } from '@/lib/scoring/recalculate'

export async function POST() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const apiMatches = await fetchKnockoutMatches()

    // Precarrega mapeamento code→id para resolver times TBD na hora do upsert
    const { data: teamsRaw } = await supabase.from('teams').select('id, code')
    const teamByCode = new Map((teamsRaw ?? []).map((t) => [t.code as string, t.id as number]))

    let updated = 0

    for (const apiMatch of apiMatches) {
      const homeTla = apiMatch.homeTeam.tla
      const awayTla = apiMatch.awayTeam.tla

      // Confronto ainda não definido — aguardar próximo sync
      if (!homeTla || !awayTla) continue
      const homeId = teamByCode.get(homeTla)
      const awayId = teamByCode.get(awayTla)
      if (!homeId || !awayId) continue

      const newStatus = mapApiStatus(apiMatch.status)
      const round = mapApiStage(apiMatch.stage)
      const { home: homeScore, away: awayScore } = getFinalScore(apiMatch)

      const { data: existing } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score, score_override')
        .eq('external_id', apiMatch.id)
        .maybeSingle()

      if (!existing) {
        // Nova partida eliminatória confirmada: inserir
        await supabase.from('matches').insert({
          external_id: apiMatch.id,
          round,
          group_id: null,
          matchday: null,
          home_team_id: homeId,
          away_team_id: awayId,
          scheduled_at: apiMatch.utcDate,
          status: newStatus,
          home_score: newStatus === 'SCHEDULED' ? null : homeScore,
          away_score: newStatus === 'SCHEDULED' ? null : awayScore,
          updated_at: new Date().toISOString(),
        })
        updated++
        continue
      }

      const hasScore =
        (newStatus === 'FINISHED' || newStatus === 'LIVE' || newStatus === 'PAUSED') &&
        homeScore !== null &&
        awayScore !== null

      // Placar corrigido manualmente: preservar e só atualizar status
      if (existing.score_override) {
        if (existing.status === newStatus) continue
        await supabase
          .from('matches')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        updated++
        continue
      }

      const hasChanged =
        existing.status !== newStatus ||
        existing.home_score !== (hasScore ? homeScore : existing.home_score) ||
        existing.away_score !== (hasScore ? awayScore : existing.away_score)

      if (!hasChanged) continue

      await supabase
        .from('matches')
        .update({
          status: newStatus,
          home_score: hasScore ? homeScore : existing.home_score,
          away_score: hasScore ? awayScore : existing.away_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (
        newStatus === 'FINISHED' &&
        existing.status !== 'FINISHED' &&
        homeScore !== null &&
        awayScore !== null
      ) {
        const { data: picks } = await supabase
          .from('match_picks')
          .select('id, home_score, away_score')
          .eq('match_id', existing.id)

        for (const pick of picks ?? []) {
          const pts = calculateMatchPoints(
            { home_score: pick.home_score, away_score: pick.away_score },
            { home_score: homeScore, away_score: awayScore }
          )
          await supabase.from('match_picks').update({ points_earned: pts }).eq('id', pick.id)
        }
      }
      updated++
    }

    // Reconciliação idempotente dos picks eliminatórios já finalizados
    const reconMatch = await scoreMatchPicks(supabase)

    await supabase.from('sync_log').insert({ matches_updated: updated, triggered_by: 'admin' })
    await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({ updated, reconMatch })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

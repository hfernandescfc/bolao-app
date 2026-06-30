import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchTodayMatches, mapApiStatus, mapApiStage, getFinalScore } from '@/lib/football-api/client'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { scoreMatchPicks } from '@/lib/scoring/recalculate'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron] CRON_SECRET não definido no ambiente da Vercel.')
    return NextResponse.json({ error: 'CRON_SECRET ausente no servidor' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // fetchTodayMatches agora retorna qualquer estágio (grupo ou eliminatória)
    const apiMatches = await fetchTodayMatches()

    const { data: teamsRaw } = await supabase.from('teams').select('id, code')
    const teamByCode = new Map((teamsRaw ?? []).map((t) => [t.code as string, t.id as number]))

    let updated = 0

    for (const apiMatch of apiMatches) {
      const newStatus = mapApiStatus(apiMatch.status)

      if (newStatus === 'SCHEDULED') continue

      const homeTla = apiMatch.homeTeam.tla
      const awayTla = apiMatch.awayTeam.tla

      const { data: existing } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score, round, score_override')
        .eq('external_id', apiMatch.id)
        .maybeSingle()

      // Partida eliminatória com times confirmados mas ainda não inserida no DB
      if (!existing) {
        if (!homeTla || !awayTla) continue
        const homeId = teamByCode.get(homeTla)
        const awayId = teamByCode.get(awayTla)
        if (!homeId || !awayId) continue

        const round = mapApiStage(apiMatch.stage)
        const { home: homeScore, away: awayScore } = getFinalScore(apiMatch)
        const hasScore = homeScore !== null && awayScore !== null

        await supabase.from('matches').insert({
          external_id: apiMatch.id,
          round,
          group_id: null,
          matchday: null,
          home_team_id: homeId,
          away_team_id: awayId,
          scheduled_at: apiMatch.utcDate,
          status: newStatus,
          home_score: hasScore ? homeScore : null,
          away_score: hasScore ? awayScore : null,
          updated_at: new Date().toISOString(),
        })
        updated++
        continue
      }

      // Usa extraTime para placar final quando disponível (prorrogação)
      const { home: homeScore, away: awayScore } = getFinalScore(apiMatch)

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
        awayScore !== null &&
        existing.round !== 'GROUP'
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

    const reconMatch = await scoreMatchPicks(supabase)

    await supabase.from('sync_log').insert({ matches_updated: updated, triggered_by: 'cron' })
    if (updated > 0 || reconMatch > 0) await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({ ok: true, updated, reconMatch })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchGroupStageMatches, mapApiStatus } from '@/lib/football-api/client'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { scoreGroupPicks } from '@/lib/scoring/recalculate'

export async function POST() {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Admin client (service role, sem cookies): as escritas de points_earned
  // precisam ignorar a RLS — como usuário (mesmo admin), o UPDATE em palpites
  // alheios afeta 0 linhas em silêncio.
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
    const apiMatches = await fetchGroupStageMatches()
    let updated = 0

    for (const apiMatch of apiMatches) {
      const newStatus = mapApiStatus(apiMatch.status)
      const homeScore = apiMatch.score.fullTime.home
      const awayScore = apiMatch.score.fullTime.away

      const { data: existing } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('external_id', apiMatch.id)
        .single()

      if (!existing) continue

      const hasChanged =
        existing.status !== newStatus ||
        existing.home_score !== homeScore ||
        existing.away_score !== awayScore

      if (!hasChanged) continue

      // Mesmo comportamento do cron: persiste o placar parcial em LIVE/PAUSED
      // e preserva o existente nos demais casos (antes zerava, apagando o
      // placar de um jogo cujo status oscilasse na API externa).
      const hasScore =
        (newStatus === 'FINISHED' || newStatus === 'LIVE' || newStatus === 'PAUSED') &&
        homeScore !== null &&
        awayScore !== null

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

    const groupUpdated = await scoreGroupPicks(supabase)

    await supabase.from('sync_log').insert({ matches_updated: updated, triggered_by: 'admin' })
    await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({ updated, groupUpdated })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

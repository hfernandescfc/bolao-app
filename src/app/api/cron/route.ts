import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchTodayMatches, mapApiStatus } from '@/lib/football-api/client'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { scoreGroupPicks } from '@/lib/scoring/recalculate'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const apiMatches = await fetchTodayMatches()
    let updated = 0

    for (const apiMatch of apiMatches) {
      const newStatus = mapApiStatus(apiMatch.status)

      if (newStatus === 'SCHEDULED') continue

      const { data: existing } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('external_id', apiMatch.id)
        .single()

      if (!existing) continue

      const homeScore = apiMatch.score.fullTime.home
      const awayScore = apiMatch.score.fullTime.away

      const hasChanged =
        existing.status !== newStatus ||
        existing.home_score !== homeScore ||
        existing.away_score !== awayScore

      if (!hasChanged) continue

      await supabase
        .from('matches')
        .update({
          status: newStatus,
          home_score: newStatus === 'FINISHED' ? homeScore : existing.home_score,
          away_score: newStatus === 'FINISHED' ? awayScore : existing.away_score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (newStatus === 'FINISHED' && existing.status !== 'FINISHED' && homeScore !== null && awayScore !== null) {
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

    // Pontua palpites de grupos que acabaram de encerrar (idempotente).
    const groupUpdated = await scoreGroupPicks(supabase)

    await supabase.from('sync_log').insert({ matches_updated: updated, triggered_by: 'cron' })
    if (updated > 0 || groupUpdated > 0) await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({ ok: true, updated, groupUpdated })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

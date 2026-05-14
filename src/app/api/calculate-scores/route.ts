import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { calculateMatchPoints, calculateGroupPoints } from '@/lib/scoring/calculator'

export async function POST(request: NextRequest) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const { data: finishedMatches } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('status', 'FINISHED')
      .not('home_score', 'is', null)

    let matchPtsUpdated = 0
    for (const match of finishedMatches ?? []) {
      const { data: picks } = await supabase
        .from('match_picks')
        .select('id, home_score, away_score')
        .eq('match_id', match.id)
        .is('points_earned', null)

      for (const pick of picks ?? []) {
        const pts = calculateMatchPoints(
          { home_score: pick.home_score, away_score: pick.away_score },
          { home_score: match.home_score!, away_score: match.away_score! }
        )
        await supabase.from('match_picks').update({ points_earned: pts }).eq('id', pick.id)
        matchPtsUpdated++
      }
    }

    await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({ updated: matchPtsUpdated })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

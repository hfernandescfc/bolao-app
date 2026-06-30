import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calculateMatchPoints } from '@/lib/scoring/calculator'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { user_id, match_id, home_score, away_score } = body as {
    user_id: string
    match_id: number
    home_score: number
    away_score: number
  }

  if (!user_id || typeof match_id !== 'number' || typeof home_score !== 'number' || typeof away_score !== 'number') {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const { data: match } = await supabase
    .from('matches')
    .select('status, home_score, away_score')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })

  const points =
    match.status === 'FINISHED' && match.home_score !== null && match.away_score !== null
      ? calculateMatchPoints(
          { home_score, away_score },
          { home_score: match.home_score, away_score: match.away_score }
        )
      : null

  const { error } = await supabase.from('match_picks').upsert(
    {
      user_id,
      match_id,
      home_score,
      away_score,
      points_earned: points,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,match_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (points !== null) {
    await supabase.rpc('recalculate_leaderboard')
  }

  return NextResponse.json({ ok: true, points_earned: points })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { scoreMatchPicks } from '@/lib/scoring/recalculate'

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
  const { match_id, home_score, away_score } = body as {
    match_id: number
    home_score: number
    away_score: number
  }

  if (
    typeof match_id !== 'number' ||
    typeof home_score !== 'number' ||
    typeof away_score !== 'number'
  ) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('matches')
    .update({
      home_score,
      away_score,
      score_override: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', match_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reconMatch = await scoreMatchPicks(supabase)
  await supabase.rpc('recalculate_leaderboard')

  return NextResponse.json({ ok: true, reconMatch })
}

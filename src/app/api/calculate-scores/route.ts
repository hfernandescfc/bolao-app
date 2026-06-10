import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { scoreMatchPicks, scoreGroupPicks } from '@/lib/scoring/recalculate'

export async function POST(request: NextRequest) {
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
    const matchPtsUpdated = await scoreMatchPicks(supabase)
    const groupPtsUpdated = await scoreGroupPicks(supabase)

    await supabase.rpc('recalculate_leaderboard')

    return NextResponse.json({
      updated: matchPtsUpdated + groupPtsUpdated,
      matchPicks: matchPtsUpdated,
      groupPicks: groupPtsUpdated,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

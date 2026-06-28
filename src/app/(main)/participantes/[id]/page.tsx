import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UserPicksView } from '@/components/picks/UserPicksView'
import { Match, MatchPick, GroupPick, Team, isMatchLocked } from '@/types'
import { getT } from '@/lib/i18n/server'

export default async function ParticipantPicksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getT()
  const tp = t.participantPicks

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = me?.role === 'admin'
  // O próprio usuário e o admin veem todos os palpites; os demais só veem os
  // palpites de partidas já travadas (10 min antes do início), para não vazar
  // palpites de jogos ainda abertos. A checagem é server-side: não dá para burlar.
  const seeAll = id === user.id || isAdmin

  // Leitura agregada: precisa enxergar além do próprio usuário, então usa o
  // service role (sem sessão), ignorando a RLS — mesmo padrão do ranking.
  const admin = createAdminClient()
  const [
    { data: target },
    { data: matchPicksRaw },
    { data: matchesRaw },
    { data: teamsRaw },
  ] = await Promise.all([
    admin.from('profiles').select('id, display_name, is_approved').eq('id', id).single(),
    admin
      .from('match_picks')
      .select('*, match:matches!inner(round)')
      .eq('user_id', id)
      .neq('match.round', 'GROUP')
      .order('match_id'),
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .neq('round', 'GROUP')
      .order('scheduled_at'),
    admin.from('teams').select('*'),
  ])

  if (!target || !target.is_approved) notFound()

  const matches = (matchesRaw ?? []) as Match[]
  const teams = (teamsRaw ?? []) as Team[]
  const groupPicks: GroupPick[] = []

  const matchMap: Record<number, Match> = {}
  for (const m of matches) matchMap[m.id] = m
  const teamMap: Record<number, Team> = {}
  for (const t_ of teams) teamMap[t_.id] = t_

  // Para terceiros, só mostra palpites de partidas já travadas.
  const matchPicks = ((matchPicksRaw ?? []) as MatchPick[]).filter((p) => {
    if (seeAll) return true
    const m = matchMap[p.match_id]
    return m ? isMatchLocked(m) : false
  })

  return (
    <div className="space-y-4">
      <BackLink label={tp.back} />
      <h1 className="text-xl font-bold text-gray-900">
        {tp.picksOf} {target.display_name}
      </h1>
      <UserPicksView
        matchPicks={matchPicks}
        groupPicks={groupPicks}
        matchMap={matchMap}
        teamMap={teamMap}
        t={t.myPicks}
      />
    </div>
  )
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"
    >
      <ArrowLeft size={14} /> {label}
    </Link>
  )
}

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UserPicksView } from '@/components/picks/UserPicksView'
import { Card, CardContent } from '@/components/ui/card'
import { Match, MatchPick, GroupPick, Team, PICKS_DEADLINE } from '@/types'
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

  // Trava de tempo (server-side): os palpites alheios só ficam visíveis depois
  // do início da Copa. Antes disso, cada um só pode abrir os próprios palpites,
  // e o admin pode ver tudo (conferência). Como a checagem e a leitura dos
  // dados acontecem aqui no servidor, ninguém consegue burlar pela URL.
  const deadlinePassed = new Date() >= PICKS_DEADLINE
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = me?.role === 'admin'
  const canView = deadlinePassed || id === user.id || isAdmin

  if (!canView) {
    return (
      <div className="space-y-4">
        <BackLink label={tp.back} />
        <Card>
          <CardContent className="py-8 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock size={18} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 max-w-xs">{tp.locked}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Leitura agregada: precisa enxergar além do próprio usuário, então usa o
  // service role (sem sessão), ignorando a RLS — mesmo padrão do ranking.
  const admin = createAdminClient()
  const [
    { data: target },
    { data: matchPicksRaw },
    { data: groupPicksRaw },
    { data: matchesRaw },
    { data: teamsRaw },
  ] = await Promise.all([
    admin.from('profiles').select('id, display_name, is_approved').eq('id', id).single(),
    admin.from('match_picks').select('*').eq('user_id', id).order('match_id'),
    admin.from('group_picks').select('*').eq('user_id', id).order('group_id'),
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('scheduled_at'),
    admin.from('teams').select('*'),
  ])

  if (!target || !target.is_approved) notFound()

  const matchPicks = (matchPicksRaw ?? []) as MatchPick[]
  const groupPicks = (groupPicksRaw ?? []) as GroupPick[]
  const matches = (matchesRaw ?? []) as Match[]
  const teams = (teamsRaw ?? []) as Team[]

  const matchMap: Record<number, Match> = {}
  for (const m of matches) matchMap[m.id] = m
  const teamMap: Record<number, Team> = {}
  for (const t_ of teams) teamMap[t_.id] = t_

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

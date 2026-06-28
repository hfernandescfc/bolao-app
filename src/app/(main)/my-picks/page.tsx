import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserPicksView } from '@/components/picks/UserPicksView'
import { Match, MatchPick, GroupPick, Team, ChampionPick } from '@/types'
import { getT } from '@/lib/i18n/server'

export default async function MyPicksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: matchPicksRaw },
    { data: matchesRaw },
    { data: teamsRaw },
    { data: championRaw },
    t,
  ] = await Promise.all([
    // Fase eliminatória: só os palpites de partidas com round != GROUP.
    supabase
      .from('match_picks')
      .select('*, match:matches!inner(round)')
      .eq('user_id', user.id)
      .neq('match.round', 'GROUP')
      .order('match_id'),
    supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .neq('round', 'GROUP')
      .order('scheduled_at'),
    supabase.from('teams').select('*'),
    supabase.from('champion_picks').select('*, team:teams(*)').eq('user_id', user.id).maybeSingle(),
    getT(),
  ])

  const matchPicks = (matchPicksRaw ?? []) as MatchPick[]
  const groupPicks: GroupPick[] = []
  const matches = (matchesRaw ?? []) as Match[]
  const teams = (teamsRaw ?? []) as Team[]
  const championPick = (championRaw ?? null) as ChampionPick | null

  const matchMap: Record<number, Match> = {}
  for (const m of matches) matchMap[m.id] = m
  const teamMap: Record<number, Team> = {}
  for (const t_ of teams) teamMap[t_.id] = t_

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t.myPicks.title}</h1>
      <UserPicksView
        matchPicks={matchPicks}
        groupPicks={groupPicks}
        matchMap={matchMap}
        teamMap={teamMap}
        championPick={championPick}
        t={t.myPicks}
      />
    </div>
  )
}

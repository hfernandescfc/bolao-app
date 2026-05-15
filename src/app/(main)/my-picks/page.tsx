import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/ui/flag'
import { Match, MatchPick, GroupPick, Team } from '@/types'
import { getT } from '@/lib/i18n/server'

function PointsBadge({ points }: { points: number | null | undefined }) {
  if (points === null || points === undefined) return <span className="text-xs text-gray-400">—</span>
  const color = points === 3 ? 'bg-green-600' : points >= 1 ? 'bg-yellow-500' : 'bg-gray-200 text-gray-600'
  return <Badge className={`text-[10px] py-0 ${color}`}>{points} pt{points !== 1 ? 's' : ''}</Badge>
}

export default async function MyPicksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: matchPicksRaw },
    { data: groupPicksRaw },
    { data: matchesRaw },
    { data: teamsRaw },
    t,
  ] = await Promise.all([
    supabase.from('match_picks').select('*').eq('user_id', user.id).order('match_id'),
    supabase.from('group_picks').select('*').eq('user_id', user.id).order('group_id'),
    supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('scheduled_at'),
    supabase.from('teams').select('*'),
    getT(),
  ])

  const matchPicks = (matchPicksRaw ?? []) as MatchPick[]
  const groupPicks = (groupPicksRaw ?? []) as GroupPick[]
  const matches = (matchesRaw ?? []) as Match[]
  const teams = (teamsRaw ?? []) as Team[]

  const matchMap: Record<number, Match> = {}
  for (const m of matches) matchMap[m.id] = m
  const teamMap: Record<number, Team> = {}
  for (const t_ of teams) teamMap[t_.id] = t_

  const matchPts = matchPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const groupPts = groupPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t.myPicks.title}</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-700">{matchPts + groupPts}</p>
            <p className="text-xs text-gray-500">{t.myPicks.total}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-gray-800">{matchPts}</p>
            <p className="text-xs text-gray-500">{t.myPicks.matches}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-gray-800">{groupPts}</p>
            <p className="text-xs text-gray-500">{t.myPicks.groups}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.myPicks.matchSection} ({matchPicks.length}/72)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {matchPicks.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.myPicks.noPicks}</p>
            )}
            {matchPicks.map((p) => {
              const m = matchMap[p.match_id]
              if (!m) return null
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-600 flex-1 min-w-0 truncate inline-flex items-center gap-1.5">
                    <Flag code={m.home_team?.code} size={14} />
                    {m.home_team?.name}
                    <span className="text-gray-400">x</span>
                    <Flag code={m.away_team?.code} size={14} />
                    {m.away_team?.name}
                  </span>
                  <span className="text-xs font-bold text-gray-800 mx-3">
                    {p.home_score} x {p.away_score}
                  </span>
                  <PointsBadge points={p.points_earned} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.myPicks.groupSection} ({groupPicks.length}/12)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {groupPicks.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.myPicks.noPicks}</p>
            )}
            {groupPicks.map((p) => {
              const t1 = teamMap[p.first_place]
              const t2 = teamMap[p.second_place]
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-600">{t.myPicks.group} {p.group_id}</span>
                  <span className="text-xs text-gray-800 mx-3 inline-flex items-center gap-1.5">
                    <Flag code={t1?.code} size={14} />
                    {t1?.name}
                    <span className="text-gray-400">·</span>
                    <Flag code={t2?.code} size={14} />
                    {t2?.name}
                  </span>
                  <PointsBadge points={p.points_earned} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

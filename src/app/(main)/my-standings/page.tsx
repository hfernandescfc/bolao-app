import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StandingsCard } from '@/components/standings/StandingsCard'
import { calculateGroupStandings, type MatchResult } from '@/lib/scoring/standings'
import type { Group, Team, Match, MatchPick, GroupPick } from '@/types'

export default async function MyStandingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: groupsRaw },
    { data: teamsRaw },
    { data: matchesRaw },
    { data: picksRaw },
    { data: groupPicksRaw },
  ] = await Promise.all([
    supabase.from('groups').select('*').order('id'),
    supabase.from('teams').select('*'),
    supabase.from('matches').select('*'),
    supabase.from('match_picks').select('*').eq('user_id', user.id),
    supabase.from('group_picks').select('*').eq('user_id', user.id),
  ])

  const groups = (groupsRaw ?? []) as Group[]
  const teams = (teamsRaw ?? []) as Team[]
  const matches = (matchesRaw ?? []) as Match[]
  const picks = (picksRaw ?? []) as MatchPick[]
  const groupPicks = (groupPicksRaw ?? []) as GroupPick[]

  const pickByMatchId = new Map(picks.map((p) => [p.match_id, p]))
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const teamsByGroup: Record<string, Team[]> = {}
  for (const t of teams) {
    ;(teamsByGroup[t.group_id] ??= []).push(t)
  }
  const groupPickByGroupId = new Map(groupPicks.map((gp) => [gp.group_id, gp]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tabela dos Grupos</h1>
        <p className="text-xs text-gray-500 mt-1">
          Como ficariam as classificações segundo seus palpites de placar.
          Jogos já encerrados usam o resultado real.
        </p>
      </div>

      <Legend />

      {groups.map((group) => {
        const groupTeams = teamsByGroup[group.id] ?? []
        const groupMatches = matches.filter((m) => m.group_id === group.id)

        const results: MatchResult[] = []
        for (const m of groupMatches) {
          if (
            m.status === 'FINISHED' &&
            m.home_score !== null &&
            m.away_score !== null
          ) {
            results.push({
              homeTeamId: m.home_team_id,
              awayTeamId: m.away_team_id,
              homeScore: m.home_score,
              awayScore: m.away_score,
            })
            continue
          }
          const pick = pickByMatchId.get(m.id)
          if (pick) {
            results.push({
              homeTeamId: m.home_team_id,
              awayTeamId: m.away_team_id,
              homeScore: pick.home_score,
              awayScore: pick.away_score,
            })
          }
        }

        const standings = calculateGroupStandings(groupTeams, results)
        const groupPick = groupPickByGroupId.get(group.id)

        return (
          <StandingsCard
            key={group.id}
            group={group}
            standings={standings}
            filledCount={results.length}
            totalMatches={groupMatches.length}
            pickedFirst={groupPick ? teamById.get(groupPick.first_place) : null}
            pickedSecond={groupPick ? teamById.get(groupPick.second_place) : null}
          />
        )
      })}
    </div>
  )
}

function Legend() {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-[11px] text-gray-600 leading-relaxed">
      <p className="font-medium text-gray-700 mb-1">Critérios de desempate (FIFA)</p>
      <ol className="list-decimal list-inside space-y-0.5 marker:text-gray-400">
        <li>Pontos</li>
        <li>Saldo de gols</li>
        <li>Gols pró</li>
        <li>Pontos / saldo / gols nos confrontos diretos entre empatados</li>
      </ol>
      <p className="mt-2 text-gray-500">
        <span className="inline-block w-3 h-3 align-middle bg-green-100 border border-green-200 rounded-sm mr-1.5" />
        Linhas em verde representam as duas vagas de classificação.
      </p>
    </div>
  )
}

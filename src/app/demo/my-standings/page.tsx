'use client'

import { useEffect, useState } from 'react'
import { MOCK_GROUPS, MOCK_TEAMS, MOCK_MATCHES } from '@/lib/mock/data'
import { StandingsCard } from '@/components/standings/StandingsCard'
import { calculateGroupStandings, type MatchResult } from '@/lib/scoring/standings'

const MATCH_PICKS_KEY = 'demo_match_picks'
const GROUP_PICKS_KEY = 'demo_group_picks'

type StoredMatchPick = { home_score: number; away_score: number }
type StoredGroupPick = { first: string; second: string }

export default function DemoStandingsPage() {
  const [matchPicks, setMatchPicks] = useState<Record<number, StoredMatchPick>>({})
  const [groupPicks, setGroupPicks] = useState<Record<string, StoredGroupPick>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const mp = localStorage.getItem(MATCH_PICKS_KEY)
      if (mp) setMatchPicks(JSON.parse(mp))
      const gp = localStorage.getItem(GROUP_PICKS_KEY)
      if (gp) setGroupPicks(JSON.parse(gp))
    } catch {
      // localStorage corrompido — ignora
    }
    setHydrated(true)
  }, [])

  const teamById = new Map(MOCK_TEAMS.map((t) => [t.id, t]))
  const teamsByGroup: Record<string, typeof MOCK_TEAMS> = {}
  for (const t of MOCK_TEAMS) {
    ;(teamsByGroup[t.group_id] ??= []).push(t)
  }

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

      {MOCK_GROUPS.map((group) => {
        const groupTeams = teamsByGroup[group.id] ?? []
        const groupMatches = MOCK_MATCHES.filter((m) => m.group_id === group.id)

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
          const pick = matchPicks[m.id]
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
        const groupPick = groupPicks[group.id]
        const pickedFirst = groupPick?.first
          ? teamById.get(parseInt(groupPick.first))
          : null
        const pickedSecond = groupPick?.second
          ? teamById.get(parseInt(groupPick.second))
          : null

        return (
          <StandingsCard
            key={group.id}
            group={group}
            standings={standings}
            filledCount={hydrated ? results.length : 0}
            totalMatches={groupMatches.length}
            pickedFirst={pickedFirst}
            pickedSecond={pickedSecond}
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

'use client'

import { useEffect, useState } from 'react'
import { MOCK_MATCHES, MOCK_TEAMS } from '@/lib/mock/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Team } from '@/types'
import { useT } from '@/lib/i18n/context'

interface MatchPick { home_score: number; away_score: number }
interface GroupPick { first: string; second: string }

export default function DemoMyPicksPage() {
  const [matchPicks, setMatchPicks] = useState<Record<number, MatchPick>>({})
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupPick>>({})
  const t = useT()

  useEffect(() => {
    const mp = localStorage.getItem('demo_match_picks')
    const gp = localStorage.getItem('demo_group_picks')
    if (mp) setMatchPicks(JSON.parse(mp))
    if (gp) setGroupPicks(JSON.parse(gp))
  }, [])

  const teamMap: Record<number, Team> = {}
  for (const t_ of MOCK_TEAMS) teamMap[t_.id] = t_

  const matchEntries = MOCK_MATCHES.filter(m => matchPicks[m.id])
  const groupKeys = Object.keys(groupPicks).sort()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t.demo.myPicksTitle}</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.demo.matchesFilled} ({matchEntries.length}/72)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {matchEntries.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.demo.goToMatches}</p>
            )}
            {matchEntries.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-600 flex-1 truncate">
                  {m.home_team?.flag_emoji} {m.home_team?.name} x {m.away_team?.name} {m.away_team?.flag_emoji}
                </span>
                <span className="text-xs font-bold text-gray-800 ml-2">
                  {matchPicks[m.id].home_score} x {matchPicks[m.id].away_score}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.demo.groupsFilled} ({groupKeys.length}/12)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {groupKeys.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.demo.goToGroups}</p>
            )}
            {groupKeys.map(g => {
              const p = groupPicks[g]
              const t1 = teamMap[parseInt(p.first)]
              const t2 = teamMap[parseInt(p.second)]
              return (
                <div key={g} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-500">{t.demo.group} {g}</span>
                  <span className="text-xs text-gray-800">
                    {t1?.flag_emoji} {t1?.name} · {t2?.flag_emoji} {t2?.name}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

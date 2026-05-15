'use client'

import { useState } from 'react'
import { Match, MatchPick } from '@/types'
import { MatchCard } from './MatchCard'
import { useT } from '@/lib/i18n/context'

interface MatchListProps {
  matches: Match[]
  picks: Record<number, MatchPick>
  isDeadlinePassed: boolean
  userId: string
  groups: string[]
}

type StatusFilter = 'all' | 'pending' | 'filled'

export function MatchList({ matches, picks, isDeadlinePassed, userId, groups }: MatchListProps) {
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterRound, setFilterRound] = useState<number>(0)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const t = useT()

  const filledCount = matches.filter((m) => picks[m.id]).length
  const pendingCount = matches.length - filledCount

  const filtered = matches.filter((m) => {
    if (filterGroup !== 'all' && m.group_id !== filterGroup) return false
    if (filterRound !== 0 && m.matchday !== filterRound) return false
    if (filterStatus === 'filled' && !picks[m.id]) return false
    if (filterStatus === 'pending' && picks[m.id]) return false
    return true
  })

  const emptyMessage =
    filterStatus === 'pending'
      ? t.matches.allFilled
      : filterStatus === 'filled'
        ? t.matches.noneFilled
        : t.matches.notFound

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {filledCount}/{matches.length} {t.matches.picksFilled}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${(filledCount / matches.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={() => setFilterStatus('all')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {t.matches.all} ({matches.length})
        </button>
        <button onClick={() => setFilterStatus('pending')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {t.matches.pending} ({pendingCount})
        </button>
        <button onClick={() => setFilterStatus('filled')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'filled' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {t.matches.filled} ({filledCount})
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button onClick={() => setFilterRound(0)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterRound === 0 ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {t.matches.all}
        </button>
        {[1, 2, 3].map((r) => (
          <button key={r} onClick={() => setFilterRound(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterRound === r ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.matches.round} {r}
          </button>
        ))}
        <div className="w-px bg-gray-200" />
        <button onClick={() => setFilterGroup('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterGroup === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {t.matches.allGroups}
        </button>
        {groups.map((g) => (
          <button key={g} onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterGroup === g ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.matches.group} {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              pick={picks[match.id] ?? null}
              isDeadlinePassed={isDeadlinePassed}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

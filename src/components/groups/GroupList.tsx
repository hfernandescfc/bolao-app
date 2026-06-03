'use client'

import { useState, useCallback } from 'react'
import { Group, Team, GroupPick } from '@/types'
import { GroupCard } from './GroupCard'
import { useT } from '@/lib/i18n/context'

interface GroupListProps {
  groups: Group[]
  teamsByGroup: Record<string, Team[]>
  picks: Record<string, GroupPick>
  isDeadlinePassed: boolean
  userId: string
}

export function GroupList({ groups, teamsByGroup, picks, isDeadlinePassed, userId }: GroupListProps) {
  const t = useT()
  // Conjunto de grupos com palpite salvo, para o contador atualizar ao vivo
  // (o estado inicial vem dos palpites carregados do servidor).
  const [filled, setFilled] = useState<Set<string>>(() => new Set(Object.keys(picks)))

  const handleSaved = useCallback((groupId: string) => {
    setFilled((prev) => (prev.has(groupId) ? prev : new Set(prev).add(groupId)))
  }, [])

  const filledCount = filled.size

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{filledCount}/{groups.length} {t.groups.filled}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${groups.length ? (filledCount / groups.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {!isDeadlinePassed && (
        <p className="text-xs text-gray-500 mb-4">{t.groups.instruction}</p>
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            teams={teamsByGroup[group.id] ?? []}
            pick={picks[group.id] ?? null}
            isDeadlinePassed={isDeadlinePassed}
            userId={userId}
            onSaved={handleSaved}
          />
        ))}
      </div>
    </>
  )
}

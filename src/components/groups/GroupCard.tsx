'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Group, Team, GroupPick } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag } from '@/components/ui/flag'
import { Check, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

interface GroupCardProps {
  group: Group
  teams: Team[]
  pick: GroupPick | null
  isDeadlinePassed: boolean
  userId: string
  onSaved?: (groupId: string) => void
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function GroupCard({ group, teams, pick, isDeadlinePassed, userId, onSaved }: GroupCardProps) {
  const [first, setFirst] = useState<string>(pick?.first_place?.toString() ?? '')
  const [second, setSecond] = useState<string>(pick?.second_place?.toString() ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const supabase = createClient()
  const t = useT()

  const savePick = useCallback(
    async (firstId: string, secondId: string) => {
      if (!firstId || !secondId || firstId === secondId) return

      setSaveState('saving')
      const { error } = await supabase.from('group_picks').upsert(
        {
          user_id: userId,
          group_id: group.id,
          first_place: parseInt(firstId),
          second_place: parseInt(secondId),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,group_id' }
      )
      setSaveState(error ? 'error' : 'saved')
      if (!error) {
        onSaved?.(group.id)
        setTimeout(() => setSaveState('idle'), 2000)
      }
    },
    [group.id, userId, supabase, onSaved]
  )

  function handleFirst(value: string | null) {
    const v = value ?? ''
    setFirst(v)
    if (v === second) setSecond('')
    else if (second && v) savePick(v, second)
  }

  function handleSecond(value: string | null) {
    const v = value ?? ''
    setSecond(v)
    if (first && v && v !== first) savePick(first, v)
  }

  const points = pick?.points_earned
  const showPoints = points !== null && points !== undefined

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">{group.name}</h3>
        <div className="flex items-center gap-2">
          {showPoints && (
            <Badge
              className={`text-[10px] py-0 ${
                points === 10 ? 'bg-green-600' : points === 6 || points === 2 ? 'bg-yellow-500' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {points} pt{points !== 1 ? 's' : ''}
            </Badge>
          )}
          {saveState === 'saving' && <Loader2 size={12} className="animate-spin text-gray-400" />}
          {saveState === 'saved' && <Check size={12} className="text-green-600" />}
          {saveState === 'error' && <span className="text-[10px] text-red-500">{t.groups.error}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {teams.map((t) => (
          <span key={t.id} className="text-xs bg-gray-50 border border-gray-100 rounded px-2 py-0.5 inline-flex items-center gap-1.5">
            <Flag code={t.code} size={16} />
            {t.name}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">{t.groups.first}</Label>
          <Select value={first} onValueChange={handleFirst} disabled={isDeadlinePassed}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t.groups.selectPlaceholder}>
                {(value: string | null) => {
                  const tm = teams.find((x) => x.id.toString() === value)
                  return tm ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Flag code={tm.code} size={16} />
                      {tm.name}
                    </span>
                  ) : t.groups.selectPlaceholder
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teams
                .filter((t) => t.id.toString() !== second)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()} className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag code={t.code} size={16} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-gray-500 mb-1 block">{t.groups.second}</Label>
          <Select value={second} onValueChange={handleSecond} disabled={isDeadlinePassed || !first}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t.groups.selectPlaceholder}>
                {(value: string | null) => {
                  const tm = teams.find((x) => x.id.toString() === value)
                  return tm ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Flag code={tm.code} size={16} />
                      {tm.name}
                    </span>
                  ) : t.groups.selectPlaceholder
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teams
                .filter((t) => t.id.toString() !== first)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()} className="text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag code={t.code} size={16} />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

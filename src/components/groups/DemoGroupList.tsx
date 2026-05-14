'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Team } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag } from '@/components/ui/flag'
import { Check } from 'lucide-react'

const STORAGE_KEY = 'demo_group_picks'

interface DemoGroupCardProps {
  group: Group
  teams: Team[]
  initialFirst: string
  initialSecond: string
  onSave: (groupId: string, first: string, second: string) => void
}

function DemoGroupCard({ group, teams, initialFirst, initialSecond, onSave }: DemoGroupCardProps) {
  const [first, setFirst] = useState(initialFirst)
  const [second, setSecond] = useState(initialSecond)
  const [saved, setSaved] = useState(false)

  function handleFirst(value: string | null) {
    const v = value ?? ''
    setFirst(v)
    if (v === second) setSecond('')
    else if (second && v) {
      onSave(group.id, v, second)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  function handleSecond(value: string | null) {
    const v = value ?? ''
    setSecond(v)
    if (first && v && v !== first) {
      onSave(group.id, first, v)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">{group.name}</h3>
        {saved && <Check size={14} className="text-green-600" />}
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
          <Label className="text-xs text-gray-500 mb-1 block">1º Lugar</Label>
          <Select value={first} onValueChange={handleFirst}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {teams.filter(t => t.id.toString() !== second).map(t => (
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
          <Label className="text-xs text-gray-500 mb-1 block">2º Lugar</Label>
          <Select value={second} onValueChange={handleSecond} disabled={!first}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {teams.filter(t => t.id.toString() !== first).map(t => (
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

interface DemoGroupListProps {
  groups: Group[]
  teamsByGroup: Record<string, Team[]>
}

export function DemoGroupList({ groups, teamsByGroup }: DemoGroupListProps) {
  const [picks, setPicks] = useState<Record<string, { first: string; second: string }>>({})

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setPicks(JSON.parse(stored))
  }, [])

  const handleSave = useCallback((groupId: string, first: string, second: string) => {
    setPicks(prev => {
      const next = { ...prev, [groupId]: { first, second } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const filledCount = Object.keys(picks).length

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{filledCount}/12 grupos preenchidos</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(filledCount / 12) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {groups.map(group => (
          <DemoGroupCard
            key={group.id}
            group={group}
            teams={teamsByGroup[group.id] ?? []}
            initialFirst={picks[group.id]?.first ?? ''}
            initialSecond={picks[group.id]?.second ?? ''}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}

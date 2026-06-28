'use client'

import { useState } from 'react'
import { Check, Crown, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Flag } from '@/components/ui/flag'
import type { Team } from '@/types'
import { useT } from '@/lib/i18n/context'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ChampionPickerProps {
  teams: Team[]
  initialTeamId: number | null
  locked: boolean
  userId: string
  /** Distribuição (team_id → nº de palpites), presente só após o fechamento. */
  distribution?: Record<number, number>
  totalPicks?: number
}

export function ChampionPicker({
  teams,
  initialTeamId,
  locked,
  userId,
  distribution,
  totalPicks,
}: ChampionPickerProps) {
  const t = useT().champion
  const [selected, setSelected] = useState<number | null>(initialTeamId)
  const [saved, setSaved] = useState<number | null>(initialTeamId)
  const [state, setState] = useState<SaveState>('idle')
  const supabase = createClient()

  const dirty = selected !== saved

  async function handleSave() {
    if (selected == null || !dirty) return
    setState('saving')
    const { error } = await supabase.from('champion_picks').upsert(
      { user_id: userId, team_id: selected, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    if (error) {
      setState('error')
      return
    }
    setSaved(selected)
    setState('saved')
    setTimeout(() => setState('idle'), 1500)
  }

  // Visão travada (pós-prazo): mostra a escolha e a distribuição.
  if (locked) {
    const myTeam = teams.find((tm) => tm.id === saved)
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-center gap-2">
          <Lock size={16} className="shrink-0" />
          <span>{t.closed}</span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500 mb-2">{t.yourPick}</p>
          {myTeam ? (
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-amber-500" />
              <Flag code={myTeam.code} size={24} />
              <span className="font-semibold text-gray-800">{myTeam.name}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t.noPick}</p>
          )}
        </div>

        {distribution && totalPicks ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-2">
            <p className="text-xs text-gray-500 mb-1">{t.distribution} ({totalPicks})</p>
            {teams
              .map((tm) => ({ tm, n: distribution[tm.id] ?? 0 }))
              .filter((x) => x.n > 0)
              .sort((a, b) => b.n - a.n)
              .map(({ tm, n }) => {
                const pct = Math.round((n / totalPicks) * 100)
                return (
                  <div key={tm.id} className="flex items-center gap-2">
                    <Flag code={tm.code} size={16} />
                    <span className="text-xs text-gray-600 w-28 truncate">{tm.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-12 text-right tabular-nums">{n} · {pct}%</span>
                  </div>
                )
              })}
          </div>
        ) : null}
      </div>
    )
  }

  // Visão aberta: escolher/editar o campeão.
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {teams.map((tm) => {
          const isSel = selected === tm.id
          return (
            <button
              key={tm.id}
              onClick={() => setSelected(tm.id)}
              className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                isSel ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <Flag code={tm.code} size={22} />
              <span className={`text-sm truncate ${isSel ? 'font-semibold text-amber-800' : 'text-gray-700'}`}>
                {tm.name}
              </span>
              {isSel && <Crown size={15} className="ml-auto text-amber-500 shrink-0" />}
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-16 flex items-center justify-end gap-3 bg-gradient-to-t from-white via-white to-transparent pt-3">
        {state === 'error' && <span className="text-xs text-red-600">{t.saveError}</span>}
        {state === 'saved' && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check size={14} /> {t.saved}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={selected == null || !dirty || state === 'saving'}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === 'saving' ? t.saving : t.save}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Match } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Flag } from '@/components/ui/flag'
import { Check, Clock, Loader2 } from 'lucide-react'

const STORAGE_KEY = 'demo_match_picks'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function DemoMatchCard({ match, initialHome, initialAway }: {
  match: Match
  initialHome: string
  initialAway: string
}) {
  const [home, setHome] = useState(initialHome)
  const [away, setAway] = useState(initialAway)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED'

  const save = useCallback((h: string, a: string) => {
    const picks = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    picks[match.id] = { home_score: parseInt(h) || 0, away_score: parseInt(a) || 0 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [match.id])

  function handleChange(value: string, side: 'home' | 'away') {
    const clean = value.replace(/\D/g, '').slice(0, 2)
    if (side === 'home') setHome(clean)
    else setAway(clean)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      save(side === 'home' ? clean : home, side === 'away' ? clean : away)
    }, 600)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isLive ? 'border-yellow-400' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-400 font-medium uppercase">
          Grupo {match.group_id} · Rodada {match.matchday}
        </span>
        <div className="flex items-center gap-2">
          {isLive && <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">AO VIVO</Badge>}
          {isFinished && (
            <span className="text-[10px] text-gray-500 font-medium">
              Resultado: {match.home_score} x {match.away_score}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="font-semibold text-sm text-gray-800 truncate">
            {match.home_team?.name}
          </span>
          <Flag code={match.home_team?.code} size={22} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            value={home}
            onChange={(e) => handleChange(e.target.value, 'home')}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-bold p-1"
            inputMode="numeric"
          />
          <span className="text-gray-400 font-bold">x</span>
          <Input
            value={away}
            onChange={(e) => handleChange(e.target.value, 'away')}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-bold p-1"
            inputMode="numeric"
          />
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Flag code={match.away_team?.code} size={22} />
          <span className="font-semibold text-sm text-gray-800 truncate">
            {match.away_team?.name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock size={10} /> {formatDate(match.scheduled_at)}
        </span>
        {saved && (
          <span className="text-[10px] text-green-600 flex items-center gap-1">
            <Check size={10} /> Salvo
          </span>
        )}
      </div>
    </div>
  )
}

type StatusFilter = 'all' | 'pending' | 'filled'

export function DemoMatchList({ matches }: { matches: Match[] }) {
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterRound, setFilterRound] = useState(0)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [picks, setPicks] = useState<Record<number, { home_score: number; away_score: number }>>({})

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setPicks(JSON.parse(stored))
  }, [])

  const groups = [...new Set(matches.map((m) => m.group_id))].sort()

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
      ? 'Tudo preenchido por aqui! 🎉'
      : filterStatus === 'filled'
        ? 'Nenhum palpite preenchido ainda.'
        : 'Nenhuma partida encontrada.'

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700">{filledCount}/{matches.length} preenchidos</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(filledCount / matches.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={() => setFilterStatus('all')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Todas ({matches.length})
        </button>
        <button onClick={() => setFilterStatus('pending')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Pendentes ({pendingCount})
        </button>
        <button onClick={() => setFilterStatus('filled')}
          className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === 'filled' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Preenchidas ({filledCount})
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {[{ label: 'Todas', val: 0 }, { label: 'Rodada 1', val: 1 }, { label: 'Rodada 2', val: 2 }, { label: 'Rodada 3', val: 3 }].map(({ label, val }) => (
          <button key={val} onClick={() => setFilterRound(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterRound === val ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {label}
          </button>
        ))}
        <div className="w-px bg-gray-200" />
        <button onClick={() => setFilterGroup('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterGroup === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Todos
        </button>
        {groups.map((g) => (
          <button key={g} onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterGroup === g ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Grupo {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <DemoMatchCard
              key={m.id}
              match={m}
              initialHome={picks[m.id]?.home_score?.toString() ?? ''}
              initialAway={picks[m.id]?.away_score?.toString() ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}

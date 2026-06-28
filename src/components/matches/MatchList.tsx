'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Match, MatchPick, Team, Round, isMatchLocked } from '@/types'
import { MatchCard } from './MatchCard'
import { calculateGroupStandings, type MatchResult, type TeamStanding } from '@/lib/scoring/standings'
import { useT } from '@/lib/i18n/context'

interface MatchListProps {
  matches: Match[]
  picks: Record<number, MatchPick>
  userId: string
  /** Resumo pós-jogo por match_id (quantos cravaram / acertaram / erraram). */
  summaries?: Record<number, MatchSummary>
}

type StatusFilter = 'all' | 'pending' | 'filled'
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export interface Draft { home: string; away: string }
export interface MatchSummary { exact: number; result: number; miss: number; total: number }

function parseDraft(d: Draft): { h: number; a: number } | null {
  const h = parseInt(d.home)
  const a = parseInt(d.away)
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return null
  return { h, a }
}

export function MatchList({ matches, picks: initialPicks, userId, summaries }: MatchListProps) {
  const [picks, setPicks] = useState(initialPicks)
  const [filterRound, setFilterRound] = useState<Round | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>({ home: '', away: '' })
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [warnId, setWarnId] = useState<number | null>(null)

  const supabase = createClient()
  const t = useT()

  function isEditable(m: Match) {
    return !isMatchLocked(m)
  }

  // Rounds disponíveis nos dados (na ordem lógica do torneio)
  const ROUND_ORDER: Round[] = ['GROUP', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL']
  const availableRounds = useMemo(() => {
    const set = new Set(matches.map((m) => m.round))
    return ROUND_ORDER.filter((r) => set.has(r))
  }, [matches])

  const teamsByGroup = useMemo(() => {
    const map: Record<string, Map<number, Team>> = {}
    for (const m of matches) {
      if (!m.group_id) continue
      const g = (map[m.group_id] ??= new Map())
      if (m.home_team) g.set(m.home_team.id, m.home_team)
      if (m.away_team) g.set(m.away_team.id, m.away_team)
    }
    return map
  }, [matches])

  const matchesByGroup = useMemo(() => {
    const map: Record<string, Match[]> = {}
    for (const m of matches) {
      if (!m.group_id) continue
      ;(map[m.group_id] ??= []).push(m)
    }
    return map
  }, [matches])

  const filledCount = matches.filter((m) => picks[m.id]).length
  const pendingCount = matches.length - filledCount

  const filtered = matches.filter((m) => {
    if (filterRound !== 'all' && m.round !== filterRound) return false
    if (filterStatus === 'filled' && !picks[m.id]) return false
    if (filterStatus === 'pending' && picks[m.id]) return false
    return true
  })

  const selectedStandings = useMemo<TeamStanding[] | null>(() => {
    if (selectedId == null) return null
    const match = matches.find((m) => m.id === selectedId)
    if (!match || !match.group_id) return null
    const groupMatches = matchesByGroup[match.group_id] ?? []
    const teams = [...(teamsByGroup[match.group_id]?.values() ?? [])]
    const draftParsed = parseDraft(draft)

    const results: MatchResult[] = []
    for (const m of groupMatches) {
      if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null) {
        results.push({ homeTeamId: m.home_team_id, awayTeamId: m.away_team_id, homeScore: m.home_score, awayScore: m.away_score })
        continue
      }
      if (m.id === selectedId) {
        if (draftParsed) results.push({ homeTeamId: m.home_team_id, awayTeamId: m.away_team_id, homeScore: draftParsed.h, awayScore: draftParsed.a })
        continue
      }
      const pick = picks[m.id]
      if (pick) results.push({ homeTeamId: m.home_team_id, awayTeamId: m.away_team_id, homeScore: pick.home_score, awayScore: pick.away_score })
    }
    return calculateGroupStandings(teams, results)
  }, [selectedId, draft, picks, matches, matchesByGroup, teamsByGroup])

  const persist = useCallback(
    async (matchId: number, h: number, a: number): Promise<boolean> => {
      const { error } = await supabase.from('match_picks').upsert(
        {
          user_id: userId,
          match_id: matchId,
          home_score: h,
          away_score: a,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id' }
      )
      if (error) return false
      setPicks((prev) => ({
        ...prev,
        [matchId]: { ...(prev[matchId] ?? {} as MatchPick), user_id: userId, match_id: matchId, home_score: h, away_score: a },
      }))
      return true
    },
    [supabase, userId]
  )

  function flashWarn(id: number | null) {
    if (id == null) return
    setWarnId(id)
    setTimeout(() => setWarnId((cur) => (cur === id ? null : cur)), 2500)
  }

  function openMatch(match: Match) {
    const p = picks[match.id]
    setSelectedId(match.id)
    setDraft({ home: p?.home_score?.toString() ?? '', away: p?.away_score?.toString() ?? '' })
    setDirty(false)
    setSaveState('idle')
  }

  function handleSelect(match: Match) {
    if (selectedId === match.id) {
      if (dirty) { flashWarn(match.id); return }
      setSelectedId(null)
      return
    }
    if (dirty) { flashWarn(selectedId); return }
    openMatch(match)
  }

  function handleChange(value: string, side: 'home' | 'away') {
    const clean = value.replace(/\D/g, '').slice(0, 2)
    setDraft((d) => ({ ...d, [side]: clean }))
    setDirty(true)
    setSaveState('idle')
  }

  async function handleSave() {
    if (selectedId == null) return
    const parsed = parseDraft(draft)
    if (!parsed) return
    const savingId = selectedId
    setSaveState('saving')
    const ok = await persist(savingId, parsed.h, parsed.a)
    if (!ok) {
      setSaveState('error')
      return
    }
    setSaveState('saved')
    setDirty(false)
    const next = filtered.find((m) => m.id !== savingId && isEditable(m) && !picks[m.id])
    if (next) {
      setTimeout(() => openMatch(next), 350)
    } else {
      setTimeout(() => setSelectedId((cur) => (cur === savingId ? null : cur)), 600)
    }
  }

  function handleDiscard() {
    if (selectedId == null) return
    setDirty(false)
    setSaveState('idle')
    setSelectedId(null)
  }

  const flushRef = useRef<() => void>(() => {})
  useEffect(() => {
    flushRef.current = () => {
      if (!dirty || selectedId == null) return
      const parsed = parseDraft(draft)
      if (!parsed) return
      void persist(selectedId, parsed.h, parsed.a)
    }
  })
  useEffect(() => {
    const onHide = () => flushRef.current()
    const onVis = () => { if (document.visibilityState === 'hidden') flushRef.current() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVis)
      flushRef.current()
    }
  }, [])

  const emptyMessage =
    filterStatus === 'pending'
      ? t.matches.allFilled
      : filterStatus === 'filled'
        ? t.matches.noneFilled
        : t.matches.notFound

  const roundLabel = (r: Round) =>
    (t.matches.roundLabels as Record<string, string>)[r] ?? r

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

      {availableRounds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button onClick={() => setFilterRound('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterRound === 'all' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.matches.allRounds}
          </button>
          {availableRounds.map((r) => (
            <button key={r} onClick={() => setFilterRound(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterRound === r ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {roundLabel(r)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => {
            const expanded = selectedId === match.id
            return (
              <MatchCard
                key={match.id}
                match={match}
                pick={picks[match.id] ?? null}
                editable={isEditable(match)}
                expanded={expanded}
                draft={expanded ? draft : undefined}
                dirty={expanded ? dirty : false}
                saveState={expanded ? saveState : 'idle'}
                standings={expanded ? selectedStandings : null}
                warn={warnId === match.id}
                picksPublic={isMatchLocked(match)}
                summary={summaries?.[match.id]}
                onSelect={() => handleSelect(match)}
                onChange={handleChange}
                onSave={handleSave}
                onDiscard={handleDiscard}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

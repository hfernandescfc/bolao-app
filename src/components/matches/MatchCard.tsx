'use client'

import Link from 'next/link'
import { Match, MatchPick } from '@/types'
import type { TeamStanding } from '@/lib/scoring/standings'
import type { Draft, SaveState, MatchSummary } from './MatchList'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Flag } from '@/components/ui/flag'
import { Check, Clock, Loader2, ChevronDown, Users } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/context'

interface MatchCardProps {
  match: Match
  pick: MatchPick | null
  editable: boolean
  expanded: boolean
  draft?: Draft
  dirty?: boolean
  saveState?: SaveState
  standings?: TeamStanding[] | null
  warn?: boolean
  /** Após o prazo, os palpites são públicos: habilita o link "ver palpites de todos". */
  picksPublic?: boolean
  /** Resumo pós-jogo (quantos cravaram / acertaram o resultado / erraram). */
  summary?: MatchSummary
  onSelect: () => void
  onChange: (value: string, side: 'home' | 'away') => void
  onSave: () => void
  onDiscard: () => void
}

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function MatchCard({
  match, pick, editable, expanded, draft, dirty, saveState = 'idle',
  standings, warn, picksPublic = false, summary, onSelect, onChange, onSave, onDiscard,
}: MatchCardProps) {
  const t = useT()
  const { locale } = useLocale()

  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED'

  const points = pick?.points_earned
  const showPoints = isFinished && points !== null && points !== undefined

  // Pontos provisórios durante o jogo: quanto o palpite renderia se o placar
  // atual fosse o final. Vira definitivo (points_earned) quando encerrar.
  const hasLiveScore = isLive && match.home_score !== null && match.away_score !== null
  const livePoints =
    hasLiveScore && pick
      ? calculateMatchPoints(
          { home_score: pick.home_score, away_score: pick.away_score },
          { home_score: match.home_score!, away_score: match.away_score! }
        )
      : null

  const home = draft?.home ?? pick?.home_score?.toString() ?? ''
  const away = draft?.away ?? pick?.away_score?.toString() ?? ''
  const canSave = !!dirty && home !== '' && away !== '' && saveState !== 'saving'

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-colors ${
        warn ? 'border-red-400 ring-1 ring-red-300' : isLive ? 'border-yellow-400' : expanded ? 'border-green-500' : 'border-gray-100'
      }`}
    >
      {/* Cabeçalho — sempre visível e clicável para selecionar/recolher */}
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-4 focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
            {match.round === 'GROUP'
              ? `${t.matches.group} ${match.group_id} · ${t.matches.round} ${match.matchday}`
              : (t.matches.roundLabels as Record<string, string>)[match.round] ?? match.round}
          </span>
          <div className="flex items-center gap-2">
            {isLive && <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">{t.matches.live}</Badge>}
            {hasLiveScore && (
              <span className="text-[10px] font-bold text-red-600">
                {match.home_score} x {match.away_score}
              </span>
            )}
            {livePoints !== null && (
              <Badge
                variant="outline"
                title={t.matches.ifItStays}
                className={`text-[10px] py-0 ${
                  livePoints === 10
                    ? 'border-green-600 text-green-700'
                    : livePoints >= 5
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-gray-300 text-gray-400'
                }`}
              >
                +{livePoints}
              </Badge>
            )}
            {isFinished && (
              <span className="text-[10px] text-gray-400">
                {match.home_score} x {match.away_score}
              </span>
            )}
            {showPoints && (
              <Badge
                className={`text-[10px] py-0 ${
                  points === 10 ? 'bg-green-600' : points! >= 5 ? 'bg-yellow-500' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {points} pt{points !== 1 ? 's' : ''}
              </Badge>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className="font-semibold text-sm text-gray-800 leading-tight truncate">
              {match.home_team?.name}
            </span>
            <Flag code={match.home_team?.code} size={22} />
          </div>

          {/* Resumo do placar quando recolhido */}
          <div className="flex items-center gap-1.5 shrink-0 w-[88px] justify-center">
            {expanded ? (
              <span className="text-[10px] text-gray-300 uppercase tracking-wide">—</span>
            ) : pick || isFinished ? (
              <span className="text-lg font-bold text-gray-800">
                {home || '–'} <span className="text-gray-300">x</span> {away || '–'}
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-medium">{t.matches.noPick}</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <Flag code={match.away_team?.code} size={22} />
            <span className="font-semibold text-sm text-gray-800 leading-tight truncate">
              {match.away_team?.name}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={10} />
            {formatDate(match.scheduled_at, locale)}
          </span>
          {!expanded && editable && !pick && (
            <span className="text-[10px] text-green-700 font-medium">{t.matches.tapToFill}</span>
          )}
        </div>
      </button>

      {/* Corpo expandido — editor + prévia do grupo */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {editable ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <Input
                  value={home}
                  onChange={(e) => onChange(e.target.value, 'home')}
                  placeholder="0"
                  autoFocus
                  className="w-14 h-12 text-center text-xl font-bold p-1"
                  inputMode="numeric"
                />
                <span className="text-gray-400 font-bold">x</span>
                <Input
                  value={away}
                  onChange={(e) => onChange(e.target.value, 'away')}
                  placeholder="0"
                  className="w-14 h-12 text-center text-xl font-bold p-1"
                  inputMode="numeric"
                />
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {t.matches.discard}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!canSave}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  {saveState === 'saving' ? (
                    <><Loader2 size={14} className="animate-spin" /> {t.matches.saving}</>
                  ) : saveState === 'saved' ? (
                    <><Check size={14} /> {t.matches.saved}</>
                  ) : (
                    t.matches.save
                  )}
                </button>
              </div>
              {saveState === 'error' && (
                <p className="text-xs text-red-500 mt-2 text-center">{t.matches.saveError}</p>
              )}
              {warn && (
                <p className="text-xs text-red-500 mt-2 text-center">{t.matches.unsaved}</p>
              )}
            </>
          ) : (
            <div className="py-2 space-y-2">
              {hasLiveScore ? (
                <p className="text-center text-sm font-semibold text-gray-800">
                  {match.home_score} x {match.away_score}
                  {livePoints !== null && (
                    <span className="block text-xs font-normal text-gray-500 mt-0.5">
                      {t.matches.ifItStays}: <span className="font-semibold">+{livePoints} pts</span>
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  {isFinished ? `${match.home_score} x ${match.away_score}` : t.matches.deadlinePassed}
                </p>
              )}
              {isFinished && summary && summary.total > 0 && (
                <MatchSummaryLine summary={summary} t={t.matches} />
              )}
              {picksPublic && (
                <Link
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 hover:underline"
                >
                  <Users size={13} /> {t.matches.seeAllPicks}
                </Link>
              )}
            </div>
          )}

          {standings && standings.length > 0 && (
            <GroupPreview standings={standings} title={t.matches.groupPreview} legend={t.matches.qualifyLegend} />
          )}
        </div>
      )}
    </div>
  )
}

function MatchSummaryLine({
  summary,
  t,
}: {
  summary: MatchSummary
  t: { summaryExact: string; summaryResult: string; summaryMiss: string }
}) {
  return (
    <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500">
      <span className="inline-flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-600" />
        {t.summaryExact}: <span className="font-semibold text-gray-700">{summary.exact}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        {t.summaryResult}: <span className="font-semibold text-gray-700">{summary.result}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        {t.summaryMiss}: <span className="font-semibold text-gray-700">{summary.miss}</span>
      </span>
    </div>
  )
}

function GroupPreview({ standings, title, legend }: { standings: TeamStanding[]; title: string; legend: string }) {
  return (
    <div className="mt-4 pt-3 border-t border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase mb-1.5 font-medium tracking-wide">{title}</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] text-gray-400 uppercase">
            <th className="text-left font-medium pb-1 w-5">#</th>
            <th className="text-left font-medium pb-1">{/* time */}</th>
            <th className="text-center font-medium pb-1 w-7">J</th>
            <th className="text-center font-medium pb-1 w-9">SG</th>
            <th className="text-right font-medium pb-1 w-9">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const isQualifying = idx < 2
            return (
              <tr key={s.team.id} className={`border-t border-gray-50 ${isQualifying ? 'bg-green-50/60' : ''}`}>
                <td className="py-1 text-gray-500 font-medium">{idx + 1}º</td>
                <td className="py-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Flag code={s.team.code} size={14} />
                    <span className={isQualifying ? 'font-semibold text-gray-900' : 'text-gray-700'}>{s.team.name}</span>
                  </span>
                </td>
                <td className="py-1 text-center text-gray-600">{s.played}</td>
                <td className={`py-1 text-center font-medium ${s.goalDiff > 0 ? 'text-green-700' : s.goalDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                </td>
                <td className="py-1 text-right font-bold text-gray-900">{s.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-gray-400">
        <span className="inline-block w-2.5 h-2.5 align-middle bg-green-100 border border-green-200 rounded-sm mr-1" />
        {legend}
      </p>
    </div>
  )
}

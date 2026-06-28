import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/ui/flag'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import type { Match, MatchPick } from '@/types'
import { isMatchLocked } from '@/types'
import type { Translations } from '@/lib/i18n/translations'

/** Distribuição dos palpites de um confronto por resultado (1 / X / 2). */
export interface ResultDistribution {
  home: number
  draw: number
  away: number
  total: number
}

interface NextMatchesCardProps {
  matches: Match[]
  pickByMatchId: Record<number, MatchPick>
  locale: string
  t: Translations['dashboard']
  /** Por match_id; presente apenas para partidas já travadas. */
  distribution?: Record<number, ResultDistribution>
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function NextMatchesCard({ matches, pickByMatchId, locale, t, distribution }: NextMatchesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-600">{t.nextMatches}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {matches.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-2">{t.noUpcoming}</p>
        ) : (
          matches.map((m) => {
            const pick = pickByMatchId[m.id]
            const isLocked = isMatchLocked(m)
            const isLive = m.status === 'LIVE' || m.status === 'PAUSED'
            const hasLiveScore = isLive && m.home_score !== null && m.away_score !== null
            const livePoints =
              hasLiveScore && pick
                ? calculateMatchPoints(
                    { home_score: pick.home_score, away_score: pick.away_score },
                    { home_score: m.home_score!, away_score: m.away_score! }
                  )
                : null
            return (
              <div key={m.id} className={`border rounded-lg p-2.5 ${isLive ? 'border-yellow-400' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                    <span className="text-xs font-medium text-gray-800 truncate">{m.home_team?.name}</span>
                    <Flag code={m.home_team?.code} size={18} />
                  </div>
                  {hasLiveScore ? (
                    <span className="text-sm font-bold text-red-600 shrink-0 tabular-nums">
                      {m.home_score}<span className="text-gray-300 mx-0.5">x</span>{m.away_score}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-bold shrink-0">x</span>
                  )}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <Flag code={m.away_team?.code} size={18} />
                    <span className="text-xs font-medium text-gray-800 truncate">{m.away_team?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  {isLive ? (
                    <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">{t.live}</Badge>
                  ) : (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(m.scheduled_at, locale)}
                    </span>
                  )}
                  {pick ? (
                    <span className="text-[11px] font-medium text-green-700">
                      {t.yourPick}: {pick.home_score} x {pick.away_score}
                      {livePoints !== null && (
                        <span
                          className={`ml-1.5 font-bold ${
                            livePoints === 10 ? 'text-green-700' : livePoints! >= 5 ? 'text-yellow-600' : 'text-gray-400'
                          }`}
                          title={t.ifItStays}
                        >
                          +{livePoints}
                        </span>
                      )}
                    </span>
                  ) : isLocked ? (
                    <span className="text-[11px] text-gray-400">{t.noPick}</span>
                  ) : (
                    <Link href="/matches" className="text-[11px] font-medium text-amber-600 inline-flex items-center gap-0.5 hover:underline">
                      {t.makePick} <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
                {isLocked && (
                  <div className="mt-1.5 text-right">
                    <Link
                      href={`/matches/${m.id}`}
                      className="text-[11px] font-medium text-green-700 inline-flex items-center gap-0.5 hover:underline"
                    >
                      {t.seeAllPicks} <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
                {(() => {
                  const d = distribution?.[m.id]
                  if (!d || d.total === 0) return null
                  return (
                    <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
                      <DistributionBar label={m.home_team?.name ?? ''} count={d.home} total={d.total} color="bg-emerald-500" />
                      <DistributionBar label={t.draw} count={d.draw} total={d.total} color="bg-gray-400" />
                      <DistributionBar label={m.away_team?.name ?? ''} count={d.away} total={d.total} color="bg-sky-500" />
                      <p className="text-[10px] text-gray-400 text-right">{d.total} {t.picksCount}</p>
                    </div>
                  )
                })()}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function DistributionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 truncate text-right shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-8 text-right shrink-0 tabular-nums">{pct}%</span>
    </div>
  )
}

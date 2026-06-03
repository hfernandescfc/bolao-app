import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flag } from '@/components/ui/flag'
import type { Match, MatchPick } from '@/types'
import type { Translations } from '@/lib/i18n/translations'

interface NextMatchesCardProps {
  matches: Match[]
  pickByMatchId: Record<number, MatchPick>
  locale: string
  isDeadlinePassed: boolean
  t: Translations['dashboard']
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function NextMatchesCard({ matches, pickByMatchId, locale, isDeadlinePassed, t }: NextMatchesCardProps) {
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
            return (
              <div key={m.id} className="border border-gray-100 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                    <span className="text-xs font-medium text-gray-800 truncate">{m.home_team?.name}</span>
                    <Flag code={m.home_team?.code} size={18} />
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold shrink-0">x</span>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <Flag code={m.away_team?.code} size={18} />
                    <span className="text-xs font-medium text-gray-800 truncate">{m.away_team?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(m.scheduled_at, locale)}
                  </span>
                  {pick ? (
                    <span className="text-[11px] font-medium text-green-700">
                      {t.yourPick}: {pick.home_score} x {pick.away_score}
                    </span>
                  ) : isDeadlinePassed ? (
                    <span className="text-[11px] text-gray-400">{t.noPick}</span>
                  ) : (
                    <Link href="/matches" className="text-[11px] font-medium text-amber-600 inline-flex items-center gap-0.5 hover:underline">
                      {t.makePick} <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

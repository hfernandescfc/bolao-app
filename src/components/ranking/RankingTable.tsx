import Link from 'next/link'
import { LeaderboardEntry } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, ArrowUp, ArrowDown } from 'lucide-react'
import type { Translations } from '@/lib/i18n/translations'

interface RankingTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  t: Translations['ranking']
  /** Quando true, o nome vira link para os palpites do participante. */
  picksVisible?: boolean
  /**
   * Pontos provisórios por user_id, vindos dos jogos AO VIVO ("se terminar
   * assim"). Quando presente (e com algum valor > 0), a tabela é reordenada
   * pelo total provisório, com setas indicando o movimento em relação à
   * posição oficial.
   */
  liveDelta?: Record<string, number>
}

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']

export function RankingTable({ entries, currentUserId, t, picksVisible = false, liveDelta }: RankingTableProps) {
  const isLive = !!liveDelta && Object.values(liveDelta).some((v) => v > 0)

  // `entries` chega na ordem oficial (total desc, exatos desc). Em modo ao
  // vivo, reordena pelo total provisório mantendo o desempate oficial.
  const rows = entries.map((entry, officialPos) => ({
    entry,
    officialPos,
    delta: liveDelta?.[entry.user_id] ?? 0,
  }))
  if (isLive) {
    rows.sort((a, b) => {
      const ta = a.entry.total_points + a.delta
      const tb = b.entry.total_points + b.delta
      if (tb !== ta) return tb - ta
      if (b.entry.exact_score_count !== a.entry.exact_score_count)
        return b.entry.exact_score_count - a.entry.exact_score_count
      return a.officialPos - b.officialPos
    })
  }

  return (
    <div>
      {isLive && <p className="text-[11px] text-gray-500 mb-2">🔴 {t.liveProvisional}</p>}
      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-800 hover:bg-green-800">
              <TableHead className="text-white w-8 text-center">#</TableHead>
              <TableHead className="text-white">{t.name}</TableHead>
              <TableHead className="text-white text-center w-16">{t.pts}</TableHead>
              <TableHead className="text-white text-center w-12 hidden sm:table-cell">{t.exact}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                  {t.empty}
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ entry, officialPos, delta }, index) => {
              const isMe = entry.user_id === currentUserId
              const medal = medalColors[index]
              const movement = isLive ? officialPos - index : 0
              return (
                <TableRow
                  key={entry.user_id}
                  className={isMe ? 'bg-green-50 font-semibold' : ''}
                >
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-0.5">
                      {index < 3 ? (
                        <Trophy size={14} className={`inline ${medal}`} />
                      ) : (
                        <span className="text-gray-400 text-sm">{index + 1}</span>
                      )}
                      {movement > 0 && <ArrowUp size={11} className="text-green-600" />}
                      {movement < 0 && <ArrowDown size={11} className="text-red-500" />}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {picksVisible ? (
                        <Link
                          href={`/participantes/${entry.user_id}`}
                          className="text-sm text-green-700 hover:underline"
                        >
                          {entry.profile?.display_name ?? t.participant}
                        </Link>
                      ) : (
                        <span className="text-sm">{entry.profile?.display_name ?? t.participant}</span>
                      )}
                      {isMe && (
                        <Badge variant="outline" className="text-[10px] py-0 border-green-600 text-green-700">
                          {t.you}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-green-700">
                    {entry.total_points}
                    {isLive && delta > 0 && (
                      <span className="ml-1 text-[10px] font-semibold text-red-600">+{delta}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-gray-500 text-sm hidden sm:table-cell">
                    {entry.exact_score_count}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

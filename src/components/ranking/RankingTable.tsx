import { LeaderboardEntry } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy } from 'lucide-react'
import type { Translations } from '@/lib/i18n/translations'

interface RankingTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  t: Translations['ranking']
}

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']

export function RankingTable({ entries, currentUserId, t }: RankingTableProps) {
  return (
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
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                {t.empty}
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry, index) => {
            const isMe = entry.user_id === currentUserId
            const medal = medalColors[index]
            return (
              <TableRow
                key={entry.user_id}
                className={isMe ? 'bg-green-50 font-semibold' : ''}
              >
                <TableCell className="text-center">
                  {index < 3 ? (
                    <Trophy size={14} className={`inline ${medal}`} />
                  ) : (
                    <span className="text-gray-400 text-sm">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{entry.profile?.display_name ?? t.participant}</span>
                    {isMe && (
                      <Badge variant="outline" className="text-[10px] py-0 border-green-600 text-green-700">
                        {t.you}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold text-green-700">
                  {entry.total_points}
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
  )
}

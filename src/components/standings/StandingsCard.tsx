import { Check, X } from 'lucide-react'
import { Flag } from '@/components/ui/flag'
import type { Group, Team } from '@/types'
import type { TeamStanding } from '@/lib/scoring/standings'
import type { Translations } from '@/lib/i18n/translations'

interface StandingsCardProps {
  group: Group
  standings: TeamStanding[]
  filledCount: number
  totalMatches: number
  pickedFirst?: Team | null
  pickedSecond?: Team | null
  t: Translations['standings']
}

export function StandingsCard({
  group, standings, filledCount, totalMatches, pickedFirst, pickedSecond, t,
}: StandingsCardProps) {
  const hasPicks = filledCount > 0
  const complete = filledCount === totalMatches
  const topTwoIds = new Set(standings.slice(0, 2).map((s) => s.team.id))
  const rankOf = (teamId: number) => standings.findIndex((s) => s.team.id === teamId) + 1

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">{group.name}</h3>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            complete ? 'bg-green-100 text-green-700' : hasPicks ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {filledCount}/{totalMatches} {t.picks}
        </span>
      </div>

      {!hasPicks ? (
        <p className="text-center text-sm text-gray-400 py-6">{t.noPicks}</p>
      ) : (
        <>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase">
                <th className="text-left font-medium pb-1.5 w-6">#</th>
                <th className="text-left font-medium pb-1.5">{t.team}</th>
                <th className="text-center font-medium pb-1.5 w-7">J</th>
                <th className="text-center font-medium pb-1.5 w-9">SG</th>
                <th className="text-center font-medium pb-1.5 w-9">GP</th>
                <th className="text-right font-medium pb-1.5 w-9">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => {
                const isQualifying = idx < 2
                return (
                  <tr key={s.team.id} className={`border-t border-gray-50 ${isQualifying ? 'bg-green-50/60' : ''}`}>
                    <td className="py-1.5 text-gray-500 font-medium">{idx + 1}º</td>
                    <td className="py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag code={s.team.code} size={16} />
                        <span className={isQualifying ? 'font-semibold text-gray-900' : 'text-gray-700'}>
                          {s.team.name}
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 text-center text-gray-600">{s.played}</td>
                    <td className={`py-1.5 text-center font-medium ${s.goalDiff > 0 ? 'text-green-700' : s.goalDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                    </td>
                    <td className="py-1.5 text-center text-gray-600">{s.goalsFor}</td>
                    <td className="py-1.5 text-right font-bold text-gray-900">{s.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(pickedFirst || pickedSecond) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase mb-1.5 font-medium tracking-wide">
                {t.yourPicks}
              </p>
              <div className="space-y-1">
                <PickComparison position={1} team={pickedFirst} actualRank={pickedFirst ? rankOf(pickedFirst.id) : 0} qualifies={pickedFirst ? topTwoIds.has(pickedFirst.id) : false} t={t} />
                <PickComparison position={2} team={pickedSecond} actualRank={pickedSecond ? rankOf(pickedSecond.id) : 0} qualifies={pickedSecond ? topTwoIds.has(pickedSecond.id) : false} t={t} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PickComparison({ position, team, actualRank, qualifies, t }: {
  position: number; team: Team | null | undefined; actualRank: number; qualifies: boolean; t: Translations['standings']
}) {
  if (!team) {
    return <p className="text-xs text-gray-400">{position}º — {t.notChosen}</p>
  }
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <span className="text-gray-500">{position}º</span>
        <Flag code={team.code} size={14} />
        <span className="text-gray-700 truncate">{team.name}</span>
      </span>
      {actualRank > 0 &&
        (qualifies ? (
          <span className="inline-flex items-center gap-1 text-green-700 text-[11px] font-medium shrink-0">
            <Check size={12} /> {t.qualifies}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-500 text-[11px] font-medium shrink-0">
            <X size={12} /> {actualRank}º {t.inYourTable}
          </span>
        ))}
    </div>
  )
}

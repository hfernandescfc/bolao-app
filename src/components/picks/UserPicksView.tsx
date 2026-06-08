import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/ui/flag'
import type { Match, MatchPick, GroupPick, Team } from '@/types'
import type { Translations } from '@/lib/i18n/translations'

function PointsBadge({ points }: { points: number | null | undefined }) {
  if (points === null || points === undefined) return <span className="text-xs text-gray-400">—</span>
  // Escala de pontos: partidas 0/3/7, grupos 0/2/6/10.
  // Verde = acerto máximo (7 ou 10), amarelo = acerto parcial, cinza = zero.
  const color = points >= 7 ? 'bg-green-600' : points > 0 ? 'bg-yellow-500' : 'bg-gray-200 text-gray-600'
  return <Badge className={`text-[10px] py-0 ${color}`}>{points} pt{points === 1 ? '' : 's'}</Badge>
}

interface UserPicksViewProps {
  matchPicks: MatchPick[]
  groupPicks: GroupPick[]
  matchMap: Record<number, Match>
  teamMap: Record<number, Team>
  t: Translations['myPicks']
}

/**
 * Apresentação dos palpites de um participante (partidas + grupos), com os
 * pontos somados no topo. Componente puro de exibição — recebe os dados já
 * resolvidos, então serve tanto para "Meus Palpites" quanto para a tela de
 * palpites de outro participante.
 */
export function UserPicksView({ matchPicks, groupPicks, matchMap, teamMap, t }: UserPicksViewProps) {
  const matchPts = matchPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const groupPts = groupPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-700">{matchPts + groupPts}</p>
            <p className="text-xs text-gray-500">{t.total}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-gray-800">{matchPts}</p>
            <p className="text-xs text-gray-500">{t.matches}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-gray-800">{groupPts}</p>
            <p className="text-xs text-gray-500">{t.groups}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.matchSection} ({matchPicks.length}/72)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {matchPicks.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.noPicks}</p>
            )}
            {matchPicks.map((p) => {
              const m = matchMap[p.match_id]
              if (!m) return null
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-600 flex-1 min-w-0 truncate inline-flex items-center gap-1.5">
                    <Flag code={m.home_team?.code} size={14} />
                    {m.home_team?.name}
                    <span className="text-gray-400">x</span>
                    <Flag code={m.away_team?.code} size={14} />
                    {m.away_team?.name}
                  </span>
                  <span className="text-xs font-bold text-gray-800 mx-3">
                    {p.home_score} x {p.away_score}
                  </span>
                  <PointsBadge points={p.points_earned} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.groupSection} ({groupPicks.length}/12)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {groupPicks.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">{t.noPicks}</p>
            )}
            {groupPicks.map((p) => {
              const t1 = teamMap[p.first_place]
              const t2 = teamMap[p.second_place]
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-600">{t.group} {p.group_id}</span>
                  <span className="text-xs text-gray-800 mx-3 inline-flex items-center gap-1.5">
                    <Flag code={t1?.code} size={14} />
                    {t1?.name}
                    <span className="text-gray-400">·</span>
                    <Flag code={t2?.code} size={14} />
                    {t2?.name}
                  </span>
                  <PointsBadge points={p.points_earned} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

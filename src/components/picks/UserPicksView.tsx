import { Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/ui/flag'
import type { Match, MatchPick, GroupPick, Team, ChampionPick } from '@/types'
import type { Translations } from '@/lib/i18n/translations'

function PointsBadge({ points }: { points: number | null | undefined }) {
  if (points === null || points === undefined) return <span className="text-xs text-gray-400">—</span>
  // Escala da fase eliminatória: 10 (placar exato), 7 (resultado + um placar),
  // 5 (resultado certo), 0 (erro). Verde = 7+, amarelo = parcial, cinza = zero.
  const color = points >= 7 ? 'bg-green-600' : points > 0 ? 'bg-yellow-500' : 'bg-gray-200 text-gray-600'
  return <Badge className={`text-[10px] py-0 ${color}`}>{points} pt{points === 1 ? '' : 's'}</Badge>
}

interface UserPicksViewProps {
  matchPicks: MatchPick[]
  groupPicks: GroupPick[]
  matchMap: Record<number, Match>
  teamMap: Record<number, Team>
  /** Palpite de campeão (com time). Ausente = não exibe a seção. */
  championPick?: ChampionPick | null
  t: Translations['myPicks']
}

/**
 * Apresentação dos palpites de um participante (partidas + grupos + campeão),
 * com os pontos somados no topo. Componente puro de exibição — recebe os dados
 * já resolvidos, então serve tanto para "Meus Palpites" quanto para a tela de
 * palpites de outro participante.
 */
export function UserPicksView({ matchPicks, groupPicks, matchMap, teamMap, championPick, t }: UserPicksViewProps) {
  const matchPts = matchPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const groupPts = groupPicks.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const champPts = championPick?.points_earned ?? 0
  const showGroups = groupPicks.length > 0
  const showChampion = championPick !== undefined && championPick !== null

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${showGroups ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-700">{matchPts + groupPts + champPts}</p>
            <p className="text-xs text-gray-500">{t.total}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-gray-800">{matchPts}</p>
            <p className="text-xs text-gray-500">{t.matches}</p>
          </CardContent>
        </Card>
        {showGroups && (
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-gray-800">{groupPts}</p>
              <p className="text-xs text-gray-500">{t.groups}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showChampion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Crown size={15} className="text-amber-500" /> {t.championSection}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {championPick!.team ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 inline-flex items-center gap-2">
                  <Flag code={championPick!.team.code} size={20} />
                  {championPick!.team.name}
                </span>
                <PointsBadge points={championPick!.points_earned} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t.noChampion}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.matchSection} ({matchPicks.length})</CardTitle>
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

      {showGroups && (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t.groupSection} ({groupPicks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
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
      )}
    </div>
  )
}

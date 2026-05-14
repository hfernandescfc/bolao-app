import { MOCK_LEADERBOARD, DEMO_USER_ID } from '@/lib/mock/data'
import { RankingTable } from '@/components/ranking/RankingTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DemoDashboardPage() {
  const myEntry = MOCK_LEADERBOARD.find((e) => e.user_id === DEMO_USER_ID)
  const myRank = MOCK_LEADERBOARD.findIndex((e) => e.user_id === DEMO_USER_ID) + 1

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Ranking</h1>

      {myEntry && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-700">{myEntry.total_points}</p>
              <p className="text-xs text-gray-500">Pontos</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-gray-800">{myRank}º</p>
              <p className="text-xs text-gray-500">Posição</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-gray-800">{myEntry.exact_score_count}</p>
              <p className="text-xs text-gray-500">Exatos</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Meu progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Palpites de partidas</span>
            <span className="font-medium">72/72</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Palpites de grupos</span>
            <span className="font-medium">12/12</span>
          </div>
        </CardContent>
      </Card>

      <RankingTable entries={MOCK_LEADERBOARD} currentUserId={DEMO_USER_ID} />
    </div>
  )
}

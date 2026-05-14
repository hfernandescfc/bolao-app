import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankingTable } from '@/components/ranking/RankingTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaderboardEntry } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: leaderboardRaw } = await supabase
    .from('leaderboard')
    .select('*, profile:profiles(display_name, email)')
    .order('total_points', { ascending: false })
    .order('exact_score_count', { ascending: false })

  const leaderboard = (leaderboardRaw ?? []) as LeaderboardEntry[]

  const myEntry = leaderboard.find((e) => e.user_id === user.id)
  const myRank = leaderboard.findIndex((e) => e.user_id === user.id) + 1

  const { count: matchPicksCount } = await supabase
    .from('match_picks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: groupPicksCount } = await supabase
    .from('group_picks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

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
            <span className="font-medium">{matchPicksCount ?? 0}/72</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Palpites de grupos</span>
            <span className="font-medium">{groupPicksCount ?? 0}/12</span>
          </div>
        </CardContent>
      </Card>

      <RankingTable entries={leaderboard} currentUserId={user.id} />

      {leaderboard.length === 0 && (
        <p className="text-center text-gray-400 text-sm pt-4">
          O ranking aparece aqui assim que os jogos começarem.
        </p>
      )}
    </div>
  )
}

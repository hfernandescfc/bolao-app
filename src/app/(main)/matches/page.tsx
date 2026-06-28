import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/paginate'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { MatchList, type MatchSummary } from '@/components/matches/MatchList'
import { Match, MatchPick } from '@/types'
import { getT } from '@/lib/i18n/server'

export default async function MatchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [[{ data: matchesRaw }, { data: picksRaw }], t] = await Promise.all([
    Promise.all([
      supabase
        .from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
        .neq('round', 'GROUP')
        .order('scheduled_at', { ascending: true }),
      supabase.from('match_picks').select('*').eq('user_id', user.id),
    ]),
    getT(),
  ])

  const matches = (matchesRaw ?? []) as Match[]
  const picks: Record<number, MatchPick> = {}
  for (const p of picksRaw ?? []) {
    picks[p.match_id] = p as MatchPick
  }

  // Resumo pós-jogo para partidas encerradas: usa admin client (RLS impediria ver todos)
  let summaries: Record<number, MatchSummary> | undefined
  const finished = matches.filter(
    (m) => m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null
  )
  if (finished.length > 0) {
    const admin = createAdminClient()
    const allPicks = await fetchAllRows<{ match_id: number; home_score: number; away_score: number }>(() =>
      admin
        .from('match_picks')
        .select('match_id, home_score, away_score')
        .in('match_id', finished.map((m) => m.id))
    )

    const resultByMatch = new Map(
      finished.map((m) => [m.id, { home_score: m.home_score!, away_score: m.away_score! }])
    )
    summaries = {}
    for (const m of finished) summaries[m.id] = { exact: 0, result: 0, miss: 0, total: 0 }
    for (const p of allPicks) {
      const real = resultByMatch.get(p.match_id)
      const s = summaries[p.match_id]
      if (!real || !s) continue
      const pts = calculateMatchPoints({ home_score: p.home_score, away_score: p.away_score }, real)
      if (pts === 10) s.exact++
      else if (pts >= 5) s.result++
      else s.miss++
      s.total++
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t.matches.title}</h1>
      </div>
      <p className="text-xs text-gray-500 mb-4">{t.matches.deadline}</p>
      {matches.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t.matches.empty}</p>
      ) : (
        <MatchList
          matches={matches}
          picks={picks}
          userId={user.id}
          summaries={summaries}
        />
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchList } from '@/components/matches/MatchList'
import { Match, MatchPick, PICKS_DEADLINE } from '@/types'

export default async function MatchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: matchesRaw }, { data: picksRaw }] = await Promise.all([
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('match_picks')
      .select('*')
      .eq('user_id', user.id),
  ])

  const matches = (matchesRaw ?? []) as Match[]
  const picks: Record<number, MatchPick> = {}
  for (const p of picksRaw ?? []) {
    picks[p.match_id] = p as MatchPick
  }

  const groups = [...new Set(matches.map((m) => m.group_id))].sort()
  const isDeadlinePassed = new Date() >= PICKS_DEADLINE

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Palpites — Partidas</h1>
        {isDeadlinePassed && (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Prazo encerrado
          </span>
        )}
      </div>
      {!isDeadlinePassed && (
        <p className="text-xs text-gray-500 mb-4">
          Palpites bloqueados em 11/06 às 13h (horário de Brasília)
        </p>
      )}
      {matches.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          As partidas serão carregadas em breve.
        </p>
      ) : (
        <MatchList
          matches={matches}
          picks={picks}
          isDeadlinePassed={isDeadlinePassed}
          userId={user.id}
          groups={groups}
        />
      )}
    </div>
  )
}

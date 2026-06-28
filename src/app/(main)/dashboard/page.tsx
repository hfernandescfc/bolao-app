import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckCircle2, ChevronRight, ScrollText } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/paginate'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { RankingTable } from '@/components/ranking/RankingTable'
import { NextMatchesCard, type ResultDistribution } from '@/components/dashboard/NextMatchesCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaderboardEntry, Match, MatchPick, isMatchLocked } from '@/types'
import { getT, getLocale } from '@/lib/i18n/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nowIso = new Date().toISOString()
  // O ranking e a contagem de participantes precisam enxergar todos os perfis
  // aprovados; a RLS de `profiles` limita o usuário ao próprio perfil, então
  // essas duas leituras usam o service role (sem sessão) para ignorar a RLS.
  const service = createAdminClient()

  const [
    { data: leaderboardRaw },
    { data: matchPicksRaw },
    { count: groupPicksCount },
    { count: participantsCount },
    { count: matchesTotal },
    { count: groupsTotal },
    { data: upcomingRaw },
    { data: liveRaw },
    t,
    locale,
  ] = await Promise.all([
    service
      .from('leaderboard')
      .select('*, profile:profiles!inner(display_name, is_approved)')
      .eq('profile.is_approved', true)
      .order('total_points', { ascending: false })
      .order('exact_score_count', { ascending: false }),
    supabase.from('match_picks').select('match_id, home_score, away_score').eq('user_id', user.id),
    supabase.from('group_picks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    service.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('groups').select('*', { count: 'exact', head: true }),
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(5),
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('status', ['LIVE', 'PAUSED'])
      .order('scheduled_at', { ascending: true }),
    getT(),
    getLocale(),
  ])

  const leaderboard = (leaderboardRaw ?? []) as LeaderboardEntry[]
  const myEntry = leaderboard.find((e) => e.user_id === user.id)
  const myRank = leaderboard.findIndex((e) => e.user_id === user.id) + 1

  const matchPicks = (matchPicksRaw ?? []) as Pick<MatchPick, 'match_id' | 'home_score' | 'away_score'>[]
  const matchPicksCount = matchPicks.length
  const pickByMatchId: Record<number, MatchPick> = {}
  for (const p of matchPicks) pickByMatchId[p.match_id] = p as MatchPick

  // Jogos ao vivo aparecem primeiro no card, seguidos dos próximos agendados.
  const liveMatches = (liveRaw ?? []) as Match[]
  const upcoming = [...liveMatches, ...((upcomingRaw ?? []) as Match[])]

  const matchesTot = matchesTotal ?? 0
  const groupsTot = groupsTotal ?? 0
  const gpCount = groupPicksCount ?? 0
  const pendingMatches = Math.max(0, matchesTot - matchPicksCount)
  const allFilled = matchesTot > 0 && pendingMatches === 0

  // Distribuição dos palpites (1/X/2) dos próximos jogos travados — partidas já
  // iniciadas ou dentro de 10 min do kickoff. Usa service role para agregar
  // os palpites de todos os participantes (a RLS limitaria ao próprio usuário).
  const lockedUpcomingIds = upcoming.filter((m) => isMatchLocked(m)).map((m) => m.id)
  let distribution: Record<number, ResultDistribution> | undefined
  if (lockedUpcomingIds.length > 0) {
    // Paginado: a soma cobre todos os participantes (5 jogos × N pode passar de
    // 1000 linhas e seria truncada em silêncio sem paginar).
    const allPicks = await fetchAllRows<{ match_id: number; home_score: number; away_score: number }>(() =>
      service
        .from('match_picks')
        .select('match_id, home_score, away_score')
        .in('match_id', lockedUpcomingIds)
    )

    distribution = {}
    for (const id of lockedUpcomingIds) distribution[id] = { home: 0, draw: 0, away: 0, total: 0 }
    for (const p of allPicks ?? []) {
      const d = distribution[p.match_id]
      if (!d) continue
      if (p.home_score > p.away_score) d.home++
      else if (p.home_score < p.away_score) d.away++
      else d.draw++
      d.total++
    }
  }

  // Ranking provisório: soma, por usuário, os pontos que os palpites dos jogos
  // AO VIVO renderiam se o placar atual fosse o final. O ranking oficial só
  // muda quando o jogo encerra (points_earned + recalculate_leaderboard).
  let liveDelta: Record<string, number> | undefined
  const liveWithScore = liveMatches.filter((m) => m.home_score !== null && m.away_score !== null)
  if (liveWithScore.length > 0) {
    const livePicks = await fetchAllRows<{ user_id: string; match_id: number; home_score: number; away_score: number }>(
      () =>
        service
          .from('match_picks')
          .select('user_id, match_id, home_score, away_score')
          .in('match_id', liveWithScore.map((m) => m.id))
    )
    const scoreByMatch = new Map(liveWithScore.map((m) => [m.id, { home_score: m.home_score!, away_score: m.away_score! }]))
    liveDelta = {}
    for (const p of livePicks) {
      const real = scoreByMatch.get(p.match_id)
      if (!real) continue
      const pts = calculateMatchPoints({ home_score: p.home_score, away_score: p.away_score }, real)
      liveDelta[p.user_id] = (liveDelta[p.user_id] ?? 0) + pts
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{t.dashboard.home}</h1>

      {myEntry && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-700">{myEntry.total_points}</p>
              <p className="text-xs text-gray-500">{t.dashboard.points}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-gray-800">{myRank}º</p>
              <p className="text-xs text-gray-500">{t.dashboard.position}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-gray-800">{myEntry.exact_score_count}</p>
              <p className="text-xs text-gray-500">{t.dashboard.exact}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* O que falta preencher */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm text-gray-600">{t.dashboard.whatsMissing}</CardTitle>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {t.dashboard.deadlineNote}
          </span>
        </CardHeader>
        <CardContent className="space-y-2">
          {allFilled ? (
            <p className="text-sm text-green-700 font-medium flex items-center gap-1.5 py-1">
              <CheckCircle2 size={16} /> {t.dashboard.allFilled}
            </p>
          ) : (
            <>
              <MissingRow
                label={t.dashboard.matchPicks}
                filled={matchPicksCount}
                total={matchesTot}
                href="/matches"
                fill={t.dashboard.fill}
                complete={t.dashboard.complete}
                disabled={false}
              />
              <MissingRow
                label={t.dashboard.groupPicks}
                filled={gpCount}
                total={groupsTot}
                href="/groups"
                fill={t.dashboard.fill}
                complete={t.dashboard.complete}
                disabled={true}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Participantes inscritos */}
      <Card>
        <CardContent className="py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Users size={18} className="text-green-700" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">{participantsCount ?? 0}</p>
            <p className="text-xs text-gray-500">{t.dashboard.participants} {t.dashboard.enrolled}</p>
          </div>
        </CardContent>
      </Card>

      {/* Próximos jogos com o palpite do usuário */}
      <NextMatchesCard
        matches={upcoming}
        pickByMatchId={pickByMatchId}
        locale={locale}
        t={t.dashboard}
        distribution={distribution}
      />

      {/* Regras do bolão */}
      <Link href="/regras" className="block">
        <Card className="hover:border-green-300 transition-colors">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <ScrollText size={18} className="text-green-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{t.dashboard.rulesTitle}</p>
              <p className="text-xs text-gray-500">{t.dashboard.rulesCta}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </CardContent>
        </Card>
      </Link>

      {/* Ranking geral */}
      <div className="pt-1">
        <h2 className="text-sm font-semibold text-gray-600 mb-2">{t.dashboard.fullRanking}</h2>
        <RankingTable entries={leaderboard} currentUserId={user.id} t={t.ranking} picksVisible={true} liveDelta={liveDelta} />
        {leaderboard.length === 0 && (
          <p className="text-center text-gray-400 text-sm pt-4">{t.dashboard.empty}</p>
        )}
      </div>
    </div>
  )
}

function MissingRow({
  label, filled, total, href, fill, complete, disabled,
}: {
  label: string; filled: number; total: number; href: string
  fill: string; complete: string; disabled: boolean
}) {
  const done = total > 0 && filled >= total
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${done ? 'text-green-700' : 'text-amber-600'}`}>
          {filled}/{total}
        </span>
        {done ? (
          <span className="text-[11px] text-green-700 inline-flex items-center gap-0.5">
            <CheckCircle2 size={13} /> {complete}
          </span>
        ) : !disabled ? (
          <Link
            href={href}
            className="text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 transition-colors rounded-full px-2.5 py-1 inline-flex items-center gap-0.5"
          >
            {fill} <ChevronRight size={12} />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

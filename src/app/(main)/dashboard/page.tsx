import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckCircle2, ChevronRight, ScrollText } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { RankingTable } from '@/components/ranking/RankingTable'
import { NextMatchesCard } from '@/components/dashboard/NextMatchesCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeaderboardEntry, Match, MatchPick, PICKS_DEADLINE } from '@/types'
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

  const upcoming = (upcomingRaw ?? []) as Match[]

  const matchesTot = matchesTotal ?? 0
  const groupsTot = groupsTotal ?? 0
  const gpCount = groupPicksCount ?? 0
  const pendingMatches = Math.max(0, matchesTot - matchPicksCount)
  const pendingGroups = Math.max(0, groupsTot - gpCount)
  const isDeadlinePassed = new Date() >= PICKS_DEADLINE
  const allFilled = matchesTot > 0 && pendingMatches === 0 && pendingGroups === 0

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
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDeadlinePassed ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            {isDeadlinePassed ? t.dashboard.deadlinePassed : t.dashboard.deadlineNote}
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
                disabled={isDeadlinePassed}
              />
              <MissingRow
                label={t.dashboard.groupPicks}
                filled={gpCount}
                total={groupsTot}
                href="/groups"
                fill={t.dashboard.fill}
                complete={t.dashboard.complete}
                disabled={isDeadlinePassed}
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
        isDeadlinePassed={isDeadlinePassed}
        t={t.dashboard}
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
        <RankingTable entries={leaderboard} currentUserId={user.id} t={t.ranking} picksVisible={isDeadlinePassed} />
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

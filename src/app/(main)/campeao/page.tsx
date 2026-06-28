import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Crown, Clock } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/paginate'
import { ChampionPicker } from '@/components/champion/ChampionPicker'
import { Match, Team, ChampionPick, CHAMPION_DEADLINE, CHAMPION_POINTS, isChampionLocked } from '@/types'
import { getT, getLocale } from '@/lib/i18n/server'

export default async function ChampionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: r32Raw }, { data: pickRaw }, t, locale] = await Promise.all([
    supabase
      .from('matches')
      .select('home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('round', 'R32'),
    supabase.from('champion_picks').select('*').eq('user_id', user.id).maybeSingle(),
    getT(),
    getLocale(),
  ])

  const tc = t.champion

  // Times que disputam a R32 (candidatos a campeão), sem duplicar.
  const teamMap = new Map<number, Team>()
  for (const m of (r32Raw ?? []) as unknown as Pick<Match, 'home_team' | 'away_team'>[]) {
    if (m.home_team) teamMap.set(m.home_team.id, m.home_team)
    if (m.away_team) teamMap.set(m.away_team.id, m.away_team)
  }
  const teams = [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name, locale === 'en' ? 'en' : 'pt'))

  const pick = (pickRaw ?? null) as ChampionPick | null
  const locked = isChampionLocked()

  // Distribuição (apenas após o fechamento): soma os palpites de todos via service role.
  let distribution: Record<number, number> | undefined
  let totalPicks: number | undefined
  if (locked) {
    const service = createAdminClient()
    const allPicks = await fetchAllRows<{ team_id: number }>(() =>
      service.from('champion_picks').select('team_id')
    )
    distribution = {}
    for (const p of allPicks) distribution[p.team_id] = (distribution[p.team_id] ?? 0) + 1
    totalPicks = allPicks.length
  }

  const deadlineLabel = CHAMPION_DEADLINE.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="space-y-4">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline mb-2">
          <ArrowLeft size={14} /> {tc.back}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Crown size={20} className="text-amber-500" /> {tc.title}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {tc.subtitle.replace('{pts}', String(CHAMPION_POINTS))}
        </p>
        {!locked && (
          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
            <Clock size={12} /> {tc.deadline.replace('{when}', deadlineLabel)}
          </p>
        )}
      </div>

      {teams.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{tc.empty}</p>
      ) : (
        <ChampionPicker
          teams={teams}
          initialTeamId={pick?.team_id ?? null}
          locked={locked}
          userId={user.id}
          distribution={distribution}
          totalPicks={totalPicks}
        />
      )}
    </div>
  )
}

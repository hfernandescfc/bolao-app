import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateMatchPoints, calculateGroupPoints } from './calculator'
import { calculateGroupStandings, type MatchResult } from './standings'
import type { Team, Match, GroupPick } from '@/types'

/**
 * Recalcula os pontos de todos os palpites de partidas ELIMINATÓRIAS já finalizadas.
 *
 * Filtra apenas matches com round != 'GROUP' para não re-scorar a fase de grupos
 * com a nova fórmula de pontuação. É idempotente.
 *
 * @returns quantidade de palpites efetivamente atualizados
 */
export async function scoreMatchPicks(supabase: SupabaseClient): Promise<number> {
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .eq('status', 'FINISHED')
    .neq('round', 'GROUP')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  let updated = 0
  for (const match of finishedMatches ?? []) {
    const { data: picks } = await supabase
      .from('match_picks')
      .select('id, home_score, away_score, points_earned')
      .eq('match_id', match.id)

    for (const pick of picks ?? []) {
      const pts = calculateMatchPoints(
        { home_score: pick.home_score, away_score: pick.away_score },
        { home_score: match.home_score, away_score: match.away_score }
      )
      if (pick.points_earned === pts) continue
      await supabase.from('match_picks').update({ points_earned: pts }).eq('id', pick.id)
      updated++
    }
  }
  return updated
}

/**
 * Recalcula os pontos dos palpites de classificados (1º e 2º do grupo).
 * Mantido para eventual necessidade histórica; não é chamado na fase eliminatória.
 *
 * @returns quantidade de palpites de grupo efetivamente atualizados
 */
export async function scoreGroupPicks(supabase: SupabaseClient): Promise<number> {
  const [{ data: teamsRaw }, { data: matchesRaw }, { data: groupPicksRaw }] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('matches').select('*').eq('round', 'GROUP'),
    supabase.from('group_picks').select('*'),
  ])

  const teams = (teamsRaw ?? []) as Team[]
  const matches = (matchesRaw ?? []) as Match[]
  const groupPicks = (groupPicksRaw ?? []) as GroupPick[]

  const teamsByGroup = new Map<string, Team[]>()
  for (const t of teams) {
    const arr = teamsByGroup.get(t.group_id) ?? []
    arr.push(t)
    teamsByGroup.set(t.group_id, arr)
  }

  const realRankByGroup = new Map<string, { first: number; second: number }>()
  for (const [groupId, groupTeams] of teamsByGroup) {
    const groupMatches = matches.filter((m) => m.group_id === groupId)
    if (groupMatches.length === 0) continue

    const allFinished = groupMatches.every(
      (m) => m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null
    )
    if (!allFinished) continue

    const results: MatchResult[] = groupMatches.map((m) => ({
      homeTeamId: m.home_team_id,
      awayTeamId: m.away_team_id,
      homeScore: m.home_score as number,
      awayScore: m.away_score as number,
    }))

    const standings = calculateGroupStandings(groupTeams, results)
    if (standings.length < 2) continue

    realRankByGroup.set(groupId, {
      first: standings[0].team.id,
      second: standings[1].team.id,
    })
  }

  let updated = 0
  for (const gp of groupPicks) {
    const real = realRankByGroup.get(gp.group_id)
    if (!real) continue

    const pts = calculateGroupPoints(
      { first_place: gp.first_place, second_place: gp.second_place },
      { first_place: real.first, second_place: real.second }
    )
    if (gp.points_earned === pts) continue
    await supabase.from('group_picks').update({ points_earned: pts }).eq('id', gp.id)
    updated++
  }

  return updated
}

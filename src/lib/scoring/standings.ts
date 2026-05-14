import type { Team } from '@/types'

/**
 * Resultado de uma partida usado para calcular a classificação.
 * Pode vir de um palpite do usuário ou do placar real.
 */
export interface MatchResult {
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
}

export interface TeamStanding {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

function emptyStats(): Omit<TeamStanding, 'team'> {
  return {
    played: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
  }
}

function computeStats(teamId: number, results: MatchResult[]): Omit<TeamStanding, 'team'> {
  const stats = emptyStats()
  for (const r of results) {
    const isHome = r.homeTeamId === teamId
    const isAway = r.awayTeamId === teamId
    if (!isHome && !isAway) continue

    const teamScore = isHome ? r.homeScore : r.awayScore
    const oppScore = isHome ? r.awayScore : r.homeScore

    stats.played++
    stats.goalsFor += teamScore
    stats.goalsAgainst += oppScore

    if (teamScore > oppScore) stats.wins++
    else if (teamScore < oppScore) stats.losses++
    else stats.draws++
  }
  stats.goalDiff = stats.goalsFor - stats.goalsAgainst
  stats.points = stats.wins * 3 + stats.draws
  return stats
}

function compareOverall(a: TeamStanding, b: TeamStanding): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  return b.goalsFor - a.goalsFor
}

/**
 * Agrupa times que ficaram totalmente empatados nos critérios gerais
 * (pontos, saldo, gols pró). Cada subgrupo precisa de desempate por confronto direto.
 */
function bucketByOverallTie(standings: TeamStanding[]): TeamStanding[][] {
  const sorted = [...standings].sort(compareOverall)
  const buckets: TeamStanding[][] = []
  let current: TeamStanding[] = []
  for (const s of sorted) {
    const head = current[0]
    if (
      head &&
      head.points === s.points &&
      head.goalDiff === s.goalDiff &&
      head.goalsFor === s.goalsFor
    ) {
      current.push(s)
    } else {
      if (current.length > 0) buckets.push(current)
      current = [s]
    }
  }
  if (current.length > 0) buckets.push(current)
  return buckets
}

/**
 * Desempata um grupo de times empatados aplicando os critérios apenas
 * sobre as partidas entre eles (mini-campeonato). Se ainda houver empate,
 * usa-se ordem alfabética como último recurso (FIFA usaria sorteio).
 */
function resolveHeadToHead(
  tied: TeamStanding[],
  allResults: MatchResult[]
): TeamStanding[] {
  if (tied.length <= 1) return tied
  const tiedIds = new Set(tied.map(s => s.team.id))
  const h2hResults = allResults.filter(
    r => tiedIds.has(r.homeTeamId) && tiedIds.has(r.awayTeamId)
  )

  const withH2H = tied.map(s => ({
    standing: s,
    h2h: computeStats(s.team.id, h2hResults),
  }))

  withH2H.sort((a, b) => {
    if (b.h2h.points !== a.h2h.points) return b.h2h.points - a.h2h.points
    if (b.h2h.goalDiff !== a.h2h.goalDiff) return b.h2h.goalDiff - a.h2h.goalDiff
    if (b.h2h.goalsFor !== a.h2h.goalsFor) return b.h2h.goalsFor - a.h2h.goalsFor
    // Último critério: ordem alfabética em português (substitui o sorteio FIFA)
    return a.standing.team.name.localeCompare(b.standing.team.name, 'pt-BR')
  })

  return withH2H.map(x => x.standing)
}

/**
 * Calcula a classificação de um grupo aplicando os critérios oficiais da FIFA:
 *
 *   1. Maior número de pontos no grupo
 *   2. Maior saldo de gols no grupo
 *   3. Maior número de gols pró no grupo
 *   4. Repete os critérios 1–3 considerando apenas os jogos entre os empatados
 *   5. (FIFA usa fair play + sorteio; aqui caímos para ordem alfabética)
 */
export function calculateGroupStandings(
  teams: Team[],
  results: MatchResult[]
): TeamStanding[] {
  const standings: TeamStanding[] = teams.map(t => ({
    team: t,
    ...computeStats(t.id, results),
  }))

  const buckets = bucketByOverallTie(standings)
  const ordered: TeamStanding[] = []
  for (const bucket of buckets) {
    ordered.push(...resolveHeadToHead(bucket, results))
  }
  return ordered
}

interface Score {
  home_score: number
  away_score: number
}

interface GroupClassification {
  first_place: number
  second_place: number
}

export function calculateMatchPoints(pick: Score, result: Score): number {
  if (pick.home_score === result.home_score && pick.away_score === result.away_score) {
    return 3
  }
  const pickOutcome = Math.sign(pick.home_score - pick.away_score)
  const realOutcome = Math.sign(result.home_score - result.away_score)
  return pickOutcome === realOutcome ? 1 : 0
}

export function calculateGroupPoints(
  pick: GroupClassification,
  result: GroupClassification
): number {
  const pickSet = new Set([pick.first_place, pick.second_place])
  let points = 0
  if (pickSet.has(result.first_place)) points++
  if (pickSet.has(result.second_place)) points++
  return points
}

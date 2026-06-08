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
    return 7
  }
  const pickOutcome = Math.sign(pick.home_score - pick.away_score)
  const realOutcome = Math.sign(result.home_score - result.away_score)
  return pickOutcome === realOutcome ? 3 : 0
}

export function calculateGroupPoints(
  pick: GroupClassification,
  result: GroupClassification
): number {
  // Acertou os dois classificados, cada um na posição certa.
  if (pick.first_place === result.first_place && pick.second_place === result.second_place) {
    return 10
  }
  // Acertou os dois classificados, mas com as posições trocadas.
  if (pick.first_place === result.second_place && pick.second_place === result.first_place) {
    return 6
  }
  // Acertou apenas um dos classificados (em qualquer posição).
  const resultSet = new Set([result.first_place, result.second_place])
  const hits = (resultSet.has(pick.first_place) ? 1 : 0) + (resultSet.has(pick.second_place) ? 1 : 0)
  return hits === 1 ? 2 : 0
}

interface Score {
  home_score: number
  away_score: number
}

interface GroupClassification {
  first_place: number
  second_place: number
}

// Pontuação fase eliminatória:
//   10 pts — placar exato
//    7 pts — resultado certo + placar de um time acertado (somente em não-empates)
//    5 pts — resultado certo (vit/emp/der)
//    0 pts — resultado errado
export function calculateMatchPoints(pick: Score, result: Score): number {
  const exactHome = pick.home_score === result.home_score
  const exactAway = pick.away_score === result.away_score

  if (exactHome && exactAway) return 10

  const pickOutcome = Math.sign(pick.home_score - pick.away_score)
  const realOutcome = Math.sign(result.home_score - result.away_score)

  if (pickOutcome !== realOutcome) return 0

  // Bônus de 2 pts: acertou o placar de um dos times (só em jogos com vencedor)
  if (realOutcome !== 0 && (exactHome || exactAway)) return 7

  return 5
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

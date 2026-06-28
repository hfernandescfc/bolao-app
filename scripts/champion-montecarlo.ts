/**
 * Simulação de Monte Carlo — pontuação total média do VENCEDOR do bolão
 * na fase eliminatória, para calibrar o valor do palpite de campeão.
 *
 * Modelo:
 *  - Torneio de 32 jogos eliminatórios (R32=16, R16=8, QF=4, SF=2, 3º=1, Final=1).
 *  - Gols de cada time ~ Poisson(λ). Em mata-mata o placar que conta é o do fim
 *    da prorrogação; empate = jogo foi a pênaltis (sem vencedor/perdedor no placar).
 *  - Cada participante palpita os 32 jogos amostrando da mesma distribuição
 *    (chute plausível, sem informação privilegiada; habilidade homogênea).
 *  - Pontuação por jogo: 10 (placar exato), 7 (resultado + placar de um time),
 *    5 (resultado certo), 0 (errado) — calculateMatchPoints.
 *  - Em cada torneio simulado, o "vencedor do bolão" é o maior pontuador entre
 *    os N participantes. Reporta a média desse máximo ao longo de M torneios.
 *
 * Uso:
 *   npx tsx scripts/champion-montecarlo.ts --env .env.local
 *   npx tsx scripts/champion-montecarlo.ts --env .env.local --n 40 --lambda 1.3 --m 20000
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env'
import { calculateMatchPoints } from '../src/lib/scoring/calculator'

loadEnv()

const GAMES = 32 // R32(16)+R16(8)+QF(4)+SF(2)+3º(1)+Final(1)

function argNum(flag: string, def: number): number {
  const i = process.argv.indexOf(flag)
  if (i >= 0 && process.argv[i + 1]) {
    const v = Number(process.argv[i + 1])
    if (!Number.isNaN(v)) return v
  }
  return def
}

/** Amostra de uma Poisson(λ) pelo método de Knuth. */
function poisson(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

async function participantCount(): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true)
    return count ?? null
  } catch {
    return null
  }
}

function simulate(N: number, lambda: number, M: number) {
  const winners: number[] = []
  let sumIndividual = 0
  let sumExactPerGame = 0
  let sumResultPerGame = 0

  for (let t = 0; t < M; t++) {
    // Resultados reais dos 32 jogos
    const real: Array<{ home_score: number; away_score: number }> = []
    for (let g = 0; g < GAMES; g++) {
      real.push({ home_score: poisson(lambda), away_score: poisson(lambda) })
    }

    let best = -1
    for (let p = 0; p < N; p++) {
      let total = 0
      for (let g = 0; g < GAMES; g++) {
        const pick = { home_score: poisson(lambda), away_score: poisson(lambda) }
        const pts = calculateMatchPoints(pick, real[g])
        total += pts
        if (t === 0 && p === 0) {
          // amostra para diagnóstico de probabilidades por jogo
        }
        if (pts === 10) sumExactPerGame++
        if (pts >= 5) sumResultPerGame++
      }
      sumIndividual += total
      if (total > best) best = total
    }
    winners.push(best)
  }

  winners.sort((a, b) => a - b)
  const mean = winners.reduce((s, x) => s + x, 0) / winners.length
  const pct = (q: number) => winners[Math.floor(q * (winners.length - 1))]
  const totalPicks = N * M * GAMES

  return {
    meanWinner: mean,
    medianWinner: pct(0.5),
    p10: pct(0.1),
    p90: pct(0.9),
    meanIndividual: sumIndividual / (N * M),
    pExactPerGame: sumExactPerGame / totalPicks,
    pResultPerGame: sumResultPerGame / totalPicks,
    meanPtsPerGame: sumIndividual / (N * M * GAMES),
  }
}

async function run() {
  const dbN = await participantCount()
  const N = argNum('--n', dbN ?? 30)
  const M = argNum('--m', 20000)

  console.log(`Participantes (N): ${N}${dbN != null ? ` (do banco: ${dbN})` : ' (default)'}`)
  console.log(`Torneios simulados (M): ${M}`)
  console.log(`Jogos por torneio: ${GAMES}`)
  console.log('')

  for (const lambda of [1.25, 1.3, 1.4]) {
    const r = simulate(N, lambda, M)
    console.log(`λ=${lambda} (≈${(lambda * 2).toFixed(1)} gols/jogo):`)
    console.log(`  pts/jogo médio: ${r.meanPtsPerGame.toFixed(2)} | P(exato)=${(r.pExactPerGame * 100).toFixed(1)}% | P(resultado)=${(r.pResultPerGame * 100).toFixed(1)}%`)
    console.log(`  pontuação individual média: ${r.meanIndividual.toFixed(1)}`)
    console.log(`  VENCEDOR — média: ${r.meanWinner.toFixed(1)} | mediana: ${r.medianWinner} | P10–P90: ${r.p10}–${r.p90}`)
    console.log(`  → 10% da média do vencedor: ${(r.meanWinner * 0.1).toFixed(1)}`)
    console.log('')
  }
}

run().catch((e) => { console.error(e); process.exit(1) })

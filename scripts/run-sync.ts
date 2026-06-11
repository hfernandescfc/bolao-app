/**
 * Roda a MESMA lógica do /api/cron contra o banco apontado por SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY, usando as funções de produção. Serve para:
 *   - sincronizar manualmente os resultados quando o cron automático falha;
 *   - validar o pipeline (fetch da API → update → scoring → leaderboard).
 *
 * Uso:
 *   npx tsx scripts/run-sync.ts --env .env.local            (dry-run: só mostra)
 *   npx tsx scripts/run-sync.ts --env .env.local --confirm  (aplica de verdade)
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env'
import { fetchGroupStageMatches, mapApiStatus } from '../src/lib/football-api/client'
import { calculateMatchPoints } from '../src/lib/scoring/calculator'
import { scoreMatchPicks, scoreGroupPicks } from '../src/lib/scoring/recalculate'

loadEnv()

const CONFIRM = process.argv.includes('--confirm')

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no env.')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const apiMatches = await fetchGroupStageMatches()
  console.log(`API retornou ${apiMatches.length} partidas.`)

  let updated = 0
  let scoredPicks = 0

  for (const apiMatch of apiMatches) {
    const newStatus = mapApiStatus(apiMatch.status)
    const homeScore = apiMatch.score.fullTime.home
    const awayScore = apiMatch.score.fullTime.away

    const { data: existing } = await supabase
      .from('matches')
      .select('id, status, home_score, away_score')
      .eq('external_id', apiMatch.id)
      .single()

    if (!existing) continue

    const hasChanged =
      existing.status !== newStatus ||
      existing.home_score !== homeScore ||
      existing.away_score !== awayScore
    if (!hasChanged) continue

    const hasScore =
      (newStatus === 'FINISHED' || newStatus === 'LIVE' || newStatus === 'PAUSED') &&
      homeScore !== null &&
      awayScore !== null

    console.log(
      `  • match ${existing.id} (ext ${apiMatch.id}): ${existing.status} ${existing.home_score ?? '-'}-${existing.away_score ?? '-'} → ${newStatus} ${hasScore ? `${homeScore}-${awayScore}` : '(sem placar)'}`
    )

    if (!CONFIRM) {
      updated++
      continue
    }

    await supabase
      .from('matches')
      .update({
        status: newStatus,
        home_score: hasScore ? homeScore : existing.home_score,
        away_score: hasScore ? awayScore : existing.away_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (newStatus === 'FINISHED' && existing.status !== 'FINISHED' && homeScore !== null && awayScore !== null) {
      const { data: picks } = await supabase
        .from('match_picks')
        .select('id, home_score, away_score')
        .eq('match_id', existing.id)
      for (const pick of picks ?? []) {
        const pts = calculateMatchPoints(
          { home_score: pick.home_score, away_score: pick.away_score },
          { home_score: homeScore, away_score: awayScore }
        )
        await supabase.from('match_picks').update({ points_earned: pts }).eq('id', pick.id)
        scoredPicks++
      }
    }
    updated++
  }

  if (CONFIRM) {
    // Rede de segurança: reconcilia todos os palpites de jogos já FINISHED e
    // os grupos encerrados (idempotente), depois recalcula o ranking.
    const reMatch = await scoreMatchPicks(supabase)
    const reGroup = await scoreGroupPicks(supabase)
    await supabase.from('sync_log').insert({ matches_updated: updated, triggered_by: 'admin' })
    await supabase.rpc('recalculate_leaderboard')
    console.log(`\n✅ Aplicado. matches atualizadas: ${updated}, picks pontuados (loop): ${scoredPicks}, reconciliados: match ${reMatch} / group ${reGroup}.`)
    console.log('   Leaderboard recalculado.')
  } else {
    console.log(`\n(dry-run) ${updated} partida(s) mudariam. Rode com --confirm para aplicar.`)
  }
}

run().catch((e) => {
  console.error('Erro:', e instanceof Error ? e.message : e)
  process.exit(1)
})

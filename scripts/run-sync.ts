/**
 * Sincronização manual das partidas eliminatórias.
 *
 * Uso:
 *   npx tsx scripts/run-sync.ts --env .env.local            (dry-run: só mostra)
 *   npx tsx scripts/run-sync.ts --env .env.local --confirm  (aplica de verdade)
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './load-env'
import {
  fetchKnockoutMatches,
  mapApiStatus,
  mapApiStage,
  getFinalScore,
} from '../src/lib/football-api/client'
import { calculateMatchPoints } from '../src/lib/scoring/calculator'
import { scoreMatchPicks } from '../src/lib/scoring/recalculate'

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

  const apiMatches = await fetchKnockoutMatches()
  console.log(`API retornou ${apiMatches.length} partidas eliminatórias.`)

  const { data: teamsRaw } = await supabase.from('teams').select('id, code')
  const teamByCode = new Map((teamsRaw ?? []).map((t) => [t.code as string, t.id as number]))

  let updated = 0
  let inserted = 0
  let scoredPicks = 0

  for (const apiMatch of apiMatches) {
    const homeTla = apiMatch.homeTeam.tla
    const awayTla = apiMatch.awayTeam.tla

    if (!homeTla || !awayTla) {
      console.log(`  • ext ${apiMatch.id} (${apiMatch.stage}): times indefinidos — ignorado`)
      continue
    }
    const homeId = teamByCode.get(homeTla)
    const awayId = teamByCode.get(awayTla)
    if (!homeId || !awayId) {
      console.log(`  • ext ${apiMatch.id}: time não encontrado no DB (${homeTla} / ${awayTla}) — ignorado`)
      continue
    }

    const newStatus = mapApiStatus(apiMatch.status)
    const round = mapApiStage(apiMatch.stage)
    const { home: homeScore, away: awayScore } = getFinalScore(apiMatch)
    const hasScore =
      (newStatus === 'FINISHED' || newStatus === 'LIVE' || newStatus === 'PAUSED') &&
      homeScore !== null &&
      awayScore !== null

    const { data: existing } = await supabase
      .from('matches')
      .select('id, status, home_score, away_score')
      .eq('external_id', apiMatch.id)
      .maybeSingle()

    if (!existing) {
      console.log(`  • ext ${apiMatch.id} (${round}): NOVA — ${homeTla} vs ${awayTla} ${newStatus}`)
      if (CONFIRM) {
        await supabase.from('matches').insert({
          external_id: apiMatch.id,
          round,
          group_id: null,
          matchday: null,
          home_team_id: homeId,
          away_team_id: awayId,
          scheduled_at: apiMatch.utcDate,
          status: newStatus,
          home_score: hasScore ? homeScore : null,
          away_score: hasScore ? awayScore : null,
          updated_at: new Date().toISOString(),
        })
      }
      inserted++
      continue
    }

    const hasChanged =
      existing.status !== newStatus ||
      existing.home_score !== (hasScore ? homeScore : existing.home_score) ||
      existing.away_score !== (hasScore ? awayScore : existing.away_score)

    if (!hasChanged) continue

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
    const reMatch = await scoreMatchPicks(supabase)
    await supabase.from('sync_log').insert({ matches_updated: updated + inserted, triggered_by: 'admin' })
    await supabase.rpc('recalculate_leaderboard')
    console.log(`\n✅ Aplicado. inseridas: ${inserted}, atualizadas: ${updated}, picks pontuados (loop): ${scoredPicks}, reconciliados: ${reMatch}.`)
    console.log('   Leaderboard recalculado.')
  } else {
    console.log(`\n(dry-run) ${inserted} novas, ${updated} partida(s) mudariam. Rode com --confirm para aplicar.`)
  }
}

run().catch((e) => {
  console.error('Erro:', e instanceof Error ? e.message : e)
  process.exit(1)
})

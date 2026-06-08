/**
 * Teste ponta-a-ponta dos palpites: garante que tudo é salvo, pontuado e
 * agregado corretamente — simulando uma "Copa em miniatura".
 *
 * O que ele faz:
 *   PARTE 1 — Lógica de pontuação (sem banco): valida calculateMatchPoints,
 *             calculateGroupPoints e a classificação/desempate de grupos.
 *   PARTE 2 — Fluxo real no banco: cria um grupo de TESTE isolado (times,
 *             6 partidas FINISHED, 3 usuários com palpites conhecidos), roda
 *             as MESMAS funções de produção (scoreMatchPicks/scoreGroupPicks
 *             + recalculate_leaderboard) e confere ponto a ponto + leaderboard.
 *   PARTE 3 — Segurança/RLS: confirma que um usuário só grava o próprio
 *             palpite e reporta o estado da trava de prazo (picks_open()).
 *
 * Tudo é criado com identificadores de teste e REMOVIDO ao final (mesmo se
 * algo falhar). Ainda assim, RODE CONTRA UM BANCO DE STAGING, não produção.
 *
 * Uso:
 *   npx tsx scripts/test-picks.ts --confirm
 *
 * Pré-requisitos (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY
 * E as migrations 001..005 aplicadas no banco.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Client } from 'pg'

import { scoreMatchPicks, scoreGroupPicks } from '../src/lib/scoring/recalculate'
import { calculateMatchPoints, calculateGroupPoints } from '../src/lib/scoring/calculator'
import { calculateGroupStandings, type MatchResult } from '../src/lib/scoring/standings'
import type { Team } from '../src/types'
import { loadEnv } from './load-env'

// ---------------------------------------------------------------------------
// Setup de ambiente
// ---------------------------------------------------------------------------
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Faltam variáveis em .env.local (URL, SERVICE_ROLE_KEY, ANON_KEY).')
  process.exit(1)
}

if (!process.argv.includes('--confirm')) {
  console.error(
    '⚠️  Este script cria e apaga dados de teste e mexe em usuários de auth.\n' +
      '   RODE APENAS contra um banco de STAGING.\n' +
      `   Banco alvo: ${URL}\n\n` +
      '   Para confirmar, rode:  npx tsx scripts/test-picks.ts --confirm'
  )
  process.exit(1)
}

const sb = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

// Identificadores isolados de teste
const TEST_GROUP = 'ZZ' // grupo inexistente nos dados reais (A..L), pontuado no teste
const TEST_GROUP_RLS = 'ZY' // grupo à parte, só para a partida do teste de RLS
const TEST_GROUPS = [TEST_GROUP, TEST_GROUP_RLS]
const TEAM_CODES = ['ZT1', 'ZT2', 'ZT3', 'ZT4']
const PASSWORD = 'TestPass123!'
const USERS = [
  { key: 'A', email: 'teste-a+bolao@example.com', name: 'Teste A (gabarito)' },
  { key: 'B', email: 'teste-b+bolao@example.com', name: 'Teste B (resultados)' },
  { key: 'C', email: 'teste-c+bolao@example.com', name: 'Teste C (zerado)' },
] as const

// Placares REAIS das 6 partidas (round-robin de 4 times).
// Classificação resultante: 1º ZT1 (9pts), 2º ZT2 (6pts), 3º ZT3, 4º ZT4.
const REAL_MATCHES = [
  { home: 'ZT1', away: 'ZT2', hs: 2, as: 0, md: 1 },
  { home: 'ZT3', away: 'ZT4', hs: 1, as: 1, md: 1 },
  { home: 'ZT1', away: 'ZT3', hs: 2, as: 0, md: 2 },
  { home: 'ZT2', away: 'ZT4', hs: 3, as: 0, md: 2 },
  { home: 'ZT1', away: 'ZT4', hs: 2, as: 0, md: 3 },
  { home: 'ZT2', away: 'ZT3', hs: 1, as: 0, md: 3 },
]

// ---------------------------------------------------------------------------
// Coletor de asserções
// ---------------------------------------------------------------------------
let passed = 0
let failed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  check(name, actual === expected, `esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)}`)
}

// ---------------------------------------------------------------------------
// PARTE 1 — Lógica pura (sem banco)
// ---------------------------------------------------------------------------
function testPureLogic() {
  console.log('\n🧮 PARTE 1 — Lógica de pontuação (sem banco)')

  // Partidas
  eq('placar exato vale 7', calculateMatchPoints({ home_score: 2, away_score: 1 }, { home_score: 2, away_score: 1 }), 7)
  eq('resultado certo, placar errado vale 3', calculateMatchPoints({ home_score: 1, away_score: 0 }, { home_score: 3, away_score: 0 }), 3)
  eq('empate (placar diferente) vale 3', calculateMatchPoints({ home_score: 0, away_score: 0 }, { home_score: 2, away_score: 2 }), 3)
  eq('resultado oposto vale 0', calculateMatchPoints({ home_score: 0, away_score: 1 }, { home_score: 2, away_score: 0 }), 0)

  // Grupos
  eq('2 classificados na ordem vale 10', calculateGroupPoints({ first_place: 1, second_place: 2 }, { first_place: 1, second_place: 2 }), 10)
  eq('2 classificados fora de ordem vale 6', calculateGroupPoints({ first_place: 2, second_place: 1 }, { first_place: 1, second_place: 2 }), 6)
  eq('acertou só um classificado vale 2', calculateGroupPoints({ first_place: 1, second_place: 3 }, { first_place: 1, second_place: 2 }), 2)
  eq('errou os dois vale 0', calculateGroupPoints({ first_place: 3, second_place: 4 }, { first_place: 1, second_place: 2 }), 0)

  // Classificação: confere ordem e desempate por saldo
  const teams: Team[] = TEAM_CODES.map((code, i) => ({
    id: i + 1, name: code, code, flag_emoji: null, group_id: TEST_GROUP,
  }))
  const idOf = (c: string) => teams[TEAM_CODES.indexOf(c)].id
  const results: MatchResult[] = REAL_MATCHES.map((m) => ({
    homeTeamId: idOf(m.home), awayTeamId: idOf(m.away), homeScore: m.hs, awayScore: m.as,
  }))
  const standings = calculateGroupStandings(teams, results)
  eq('1º colocado é ZT1', standings[0].team.code, 'ZT1')
  eq('2º colocado é ZT2', standings[1].team.code, 'ZT2')
  eq('3º (desempate por saldo) é ZT3', standings[2].team.code, 'ZT3')
  eq('líder somou 9 pontos', standings[0].points, 9)
}

// ---------------------------------------------------------------------------
// Geração de palpites por perfil de usuário
// ---------------------------------------------------------------------------
// A = gabarito (placar exato), B = acerta resultado (placar errado), C = erra tudo
function pickFor(userKey: string, real: { hs: number; as: number }): { hs: number; as: number } {
  if (userKey === 'A') return { hs: real.hs, as: real.as }
  if (userKey === 'B') {
    if (real.hs === real.as) return { hs: real.hs + 1, as: real.as + 1 } // empate, placar diferente
    return { hs: real.hs + 1, as: real.as } // mantém vencedor (mandante), placar diferente
  }
  // C: inverte o resultado
  if (real.hs === real.as) return { hs: 1, as: 0 } // empate -> vitória mandante
  return { hs: 0, as: 1 } // vitória mandante -> vitória visitante
}
// Pontos de partida esperados por perfil (independente do calculator)
const EXPECTED_MATCH_PTS: Record<string, number> = { A: 7, B: 3, C: 0 }
// Palpite de classificados e pontos esperados por perfil.
// Real do grupo: 1º ZT1, 2º ZT2.
const GROUP_PICK: Record<string, [string, string]> = {
  A: ['ZT1', 'ZT2'], // ambos na ordem certa -> 10
  B: ['ZT1', 'ZT3'], // só o 1º certo -> 2
  C: ['ZT4', 'ZT3'], // nenhum -> 0
}
const EXPECTED_GROUP_PTS: Record<string, number> = { A: 10, B: 2, C: 0 }

// ---------------------------------------------------------------------------
// Cleanup (idempotente)
// ---------------------------------------------------------------------------
async function cleanup(client: SupabaseClient) {
  // Apaga usuários de teste (cascade remove profiles/picks/leaderboard).
  const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const emails = new Set<string>(USERS.map((u) => u.email))
  for (const u of data?.users ?? []) {
    if (u.email && emails.has(u.email)) await client.auth.admin.deleteUser(u.id)
  }
  // Remove partidas, times e grupos de teste.
  const { data: testMatches } = await client.from('matches').select('id').in('group_id', TEST_GROUPS)
  const ids = (testMatches ?? []).map((m: { id: number }) => m.id)
  if (ids.length) {
    await client.from('match_picks').delete().in('match_id', ids)
    await client.from('matches').delete().in('group_id', TEST_GROUPS)
  }
  await client.from('group_picks').delete().in('group_id', TEST_GROUPS)
  await client.from('teams').delete().in('group_id', TEST_GROUPS)
  await client.from('groups').delete().in('id', TEST_GROUPS)
}

// ---------------------------------------------------------------------------
// PARTE 2 — Fluxo completo no banco
// ---------------------------------------------------------------------------
async function testDatabaseFlow() {
  console.log('\n🗄️  PARTE 2 — Fluxo de gravação + pontuação no banco')

  // Grupos + times (ZZ = pontuado; ZY = só para o teste de RLS)
  await sb.from('groups').upsert([
    { id: TEST_GROUP, name: 'Grupo TESTE' },
    { id: TEST_GROUP_RLS, name: 'Grupo TESTE RLS' },
  ])
  const { data: teamRows, error: teamErr } = await sb
    .from('teams')
    .insert(TEAM_CODES.map((code) => ({ name: `Time ${code}`, code, group_id: TEST_GROUP, flag_emoji: '🏳️' })))
    .select('id, code')
  if (teamErr) throw teamErr
  const teamId = new Map<string, number>(teamRows!.map((t: { id: number; code: string }) => [t.code, t.id]))

  // Partidas FINISHED com placar real + 1 partida SCHEDULED para teste de RLS
  const scoringPayloads = REAL_MATCHES.map((m) => ({
    group_id: TEST_GROUP, matchday: m.md,
    home_team_id: teamId.get(m.home)!, away_team_id: teamId.get(m.away)!,
    scheduled_at: new Date().toISOString(), status: 'FINISHED', home_score: m.hs, away_score: m.as,
  }))
  const { data: matchRows, error: matchErr } = await sb
    .from('matches').insert(scoringPayloads).select('id, home_team_id, away_team_id')
  if (matchErr) throw matchErr
  const scoringMatchIds = matchRows!.map((m: { id: number }) => m.id)

  const { data: rlsRows } = await sb
    .from('matches')
    .insert([
      // partida para o teste de propriedade (dono x não-dono)
      { group_id: TEST_GROUP_RLS, matchday: 1, home_team_id: teamId.get('ZT1')!, away_team_id: teamId.get('ZT2')!, scheduled_at: new Date().toISOString(), status: 'SCHEDULED' },
      // partida sem palpites, para o teste de "depois do prazo" (INSERT limpo)
      { group_id: TEST_GROUP_RLS, matchday: 2, home_team_id: teamId.get('ZT3')!, away_team_id: teamId.get('ZT4')!, scheduled_at: new Date().toISOString(), status: 'SCHEDULED' },
    ])
    .select('id')
  const rlsMatchId = rlsRows![0].id as number
  const deadlineMatchId = rlsRows![1].id as number

  // Mapa matchId -> placar real, para gerar palpites coerentes
  const realByMatch = new Map<number, { hs: number; as: number; home: number }>()
  REAL_MATCHES.forEach((m, i) => {
    realByMatch.set(scoringMatchIds[i], { hs: m.hs, as: m.as, home: teamId.get(m.home)! })
  })

  // Usuários de teste (aprovados)
  const userId: Record<string, string> = {}
  for (const u of USERS) {
    const { data: created, error } = await sb.auth.admin.createUser({
      email: u.email, password: PASSWORD, email_confirm: true,
      user_metadata: { display_name: u.name },
    })
    if (error) throw error
    userId[u.key] = created.user!.id
    await sb.from('profiles').update({ is_approved: true }).eq('id', created.user!.id)
  }

  // Palpites de partidas e de grupos (points_earned fica NULL)
  for (const u of USERS) {
    const matchPicks = REAL_MATCHES.map((m, i) => {
      const p = pickFor(u.key, m)
      return { user_id: userId[u.key], match_id: scoringMatchIds[i], home_score: p.hs, away_score: p.as }
    })
    const { error: mpErr } = await sb.from('match_picks').insert(matchPicks)
    if (mpErr) throw mpErr

    const [first, second] = GROUP_PICK[u.key]
    const { error: gpErr } = await sb.from('group_picks').insert({
      user_id: userId[u.key], group_id: TEST_GROUP,
      first_place: teamId.get(first)!, second_place: teamId.get(second)!,
    })
    if (gpErr) throw gpErr
  }
  console.log('  • Dados de teste criados (3 usuários, 6 partidas, 1 grupo)')

  // >>> Executa exatamente a lógica de produção <<<
  const mUpd = await scoreMatchPicks(sb)
  const gUpd = await scoreGroupPicks(sb)
  await sb.rpc('recalculate_leaderboard')
  console.log(`  • Pontuação executada (match_picks atualizados=${mUpd}, group_picks=${gUpd})`)

  // ----- Validação por palpite de partida -----
  const { data: mpAfter } = await sb
    .from('match_picks').select('user_id, match_id, points_earned').in('match_id', scoringMatchIds)
  const ptsByUserMatch = new Map<string, number | null>()
  for (const r of mpAfter ?? []) ptsByUserMatch.set(`${r.user_id}:${r.match_id}`, r.points_earned)

  for (const u of USERS) {
    let ok = true
    for (const mid of scoringMatchIds) {
      if (ptsByUserMatch.get(`${userId[u.key]}:${mid}`) !== EXPECTED_MATCH_PTS[u.key]) ok = false
    }
    check(`partidas de ${u.key}: todas com ${EXPECTED_MATCH_PTS[u.key]} pt(s)`, ok)
  }

  // Cruza com o calculator (consistência da função pura vs. dados gravados)
  let calcConsistent = true
  for (const u of USERS) {
    REAL_MATCHES.forEach((m, i) => {
      const p = pickFor(u.key, m)
      const expected = calculateMatchPoints({ home_score: p.hs, away_score: p.as }, { home_score: m.hs, away_score: m.as })
      if (ptsByUserMatch.get(`${userId[u.key]}:${scoringMatchIds[i]}`) !== expected) calcConsistent = false
    })
  }
  check('pontos gravados batem com calculateMatchPoints', calcConsistent)

  // ----- Validação por palpite de grupo -----
  const { data: gpAfter } = await sb
    .from('group_picks').select('user_id, points_earned').eq('group_id', TEST_GROUP)
  const groupPtsByUser = new Map<string, number | null>()
  for (const r of gpAfter ?? []) groupPtsByUser.set(r.user_id, r.points_earned)
  for (const u of USERS) {
    eq(`grupo de ${u.key}`, groupPtsByUser.get(userId[u.key]), EXPECTED_GROUP_PTS[u.key])
  }

  // ----- Validação do leaderboard (pega o bug de fan-out) -----
  const { data: lb } = await sb
    .from('leaderboard')
    .select('user_id, match_points, group_points, total_points, exact_score_count, correct_result_count')
    .in('user_id', Object.values(userId))
  const lbByUser = new Map<string, Record<string, number>>()
  for (const r of lb ?? []) lbByUser.set(r.user_id, r)

  const expectedMatchTotal: Record<string, number> = { A: 42, B: 18, C: 0 } // 6 partidas × 7 (exato) / 3 (resultado)
  const expectedExact: Record<string, number> = { A: 6, B: 0, C: 0 }
  const expectedCorrect: Record<string, number> = { A: 0, B: 6, C: 0 }
  for (const u of USERS) {
    const row = lbByUser.get(userId[u.key])
    const expectedTotal = expectedMatchTotal[u.key] + EXPECTED_GROUP_PTS[u.key]
    if (!row) {
      check(`leaderboard de ${u.key} existe`, false)
      continue
    }
    eq(`leaderboard ${u.key}: match_points`, row.match_points, expectedMatchTotal[u.key])
    eq(`leaderboard ${u.key}: group_points`, row.group_points, EXPECTED_GROUP_PTS[u.key])
    eq(`leaderboard ${u.key}: total_points`, row.total_points, expectedTotal)
    eq(`leaderboard ${u.key}: placares exatos`, row.exact_score_count, expectedExact[u.key])
    eq(`leaderboard ${u.key}: acertos de resultado`, row.correct_result_count, expectedCorrect[u.key])
  }

  // ----- Idempotência: rodar de novo não deve alterar nada -----
  const mUpd2 = await scoreMatchPicks(sb)
  const gUpd2 = await scoreGroupPicks(sb)
  check('reexecução é idempotente (0 alterações)', mUpd2 === 0 && gUpd2 === 0, `match=${mUpd2}, group=${gUpd2}`)

  return { userId, rlsMatchId, deadlineMatchId }
}

// ---------------------------------------------------------------------------
// PARTE 3 — Segurança / RLS
// ---------------------------------------------------------------------------
const PICKS_OPEN_CLOSED = `CREATE OR REPLACE FUNCTION public.picks_open() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;`
const PICKS_OPEN_RESTORE = `CREATE OR REPLACE FUNCTION public.picks_open() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT NOW() < TIMESTAMPTZ '2026-06-11 16:00:00+00'; $$;`

async function testSecurity(userId: Record<string, string>, rlsMatchId: number, deadlineMatchId: number) {
  console.log('\n🔒 PARTE 3 — Propriedade dos palpites e trava de prazo')

  // Estado da trava de prazo (migration 004)
  const { data: open, error: openErr } = await sb.rpc('picks_open')
  if (openErr) {
    check('função picks_open() existe (migration 004 aplicada)', false, openErr.message)
  } else {
    check('função picks_open() existe (migration 004 aplicada)', true)
    console.log(`     → palpites ${open ? 'ABERTOS' : 'FECHADOS'} no momento (deadline 2026-06-11T16:00Z)`)
  }

  // Cliente como usuário comum (sujeito a RLS)
  const anon = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
  const { error: signErr } = await anon.auth.signInWithPassword({ email: USERS[0].email, password: PASSWORD })
  if (signErr) {
    check('login do usuário de teste', false, signErr.message)
    return
  }

  // Pode gravar o PRÓPRIO palpite
  const { error: ownErr } = await anon.from('match_picks').upsert(
    { user_id: userId.A, match_id: rlsMatchId, home_score: 1, away_score: 1, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,match_id' }
  )
  check('usuário grava o próprio palpite', !ownErr, ownErr?.message)

  // NÃO pode gravar palpite de outro usuário
  const { error: foreignErr } = await anon.from('match_picks').insert({
    user_id: userId.B, match_id: rlsMatchId, home_score: 5, away_score: 5,
  })
  check('RLS bloqueia gravar palpite de outro usuário', !!foreignErr, 'inserção indevida foi aceita!')

  // Teste do "depois do prazo": desliga picks_open() temporariamente via SQL
  // direto e confirma que a RLS recusa a gravação. Restaura sempre no finally.
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.log('     ℹ️  SUPABASE_DB_URL ausente — pulando o teste automático de "depois do prazo".')
    return
  }
  const pg = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await pg.connect()
  try {
    await pg.query(PICKS_OPEN_CLOSED)
    const { error: afterErr } = await anon.from('match_picks').insert({
      user_id: userId.A, match_id: deadlineMatchId, home_score: 1, away_score: 0,
    })
    check('RLS bloqueia gravar palpite DEPOIS do prazo', !!afterErr, 'gravação após o prazo foi aceita!')
  } finally {
    await pg.query(PICKS_OPEN_RESTORE)
    await pg.end()
  }
  const { data: openAgain } = await sb.rpc('picks_open')
  check('picks_open() restaurado ao normal após o teste', openAgain === true)
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  console.log(`🎯 Teste de palpites — banco: ${URL}`)
  await cleanup(sb) // limpa resíduos de execuções anteriores

  try {
    testPureLogic()
    const { userId, rlsMatchId, deadlineMatchId } = await testDatabaseFlow()
    await testSecurity(userId, rlsMatchId, deadlineMatchId)
  } finally {
    await cleanup(sb)
    console.log('\n🧹 Dados de teste removidos.')
  }

  console.log(`\n================  RESULTADO: ${passed} ✅   ${failed} ❌  ================`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\n💥 Erro inesperado durante o teste:', err)
  // Tenta limpar mesmo em caso de erro fora do try/finally
  cleanup(sb).finally(() => process.exit(1))
})

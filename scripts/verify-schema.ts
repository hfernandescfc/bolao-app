/**
 * Verificação READ-ONLY do schema: confirma que as correções de integridade
 * (migrations 004 e 005) estão de fato aplicadas no banco-alvo.
 *
 * Não cria, altera nem apaga nada — só consulta o catálogo do Postgres.
 *
 * Uso:
 *   npx tsx scripts/verify-schema.ts --env .env.local       (produção)
 *   npx tsx scripts/verify-schema.ts --env .env.staging
 *
 * Requer SUPABASE_DB_URL no arquivo de env.
 */
import { Client } from 'pg'
import { loadEnv } from './load-env'

loadEnv()

const DB_URL = process.env.SUPABASE_DB_URL
if (!DB_URL) {
  console.error('❌ Faltando SUPABASE_DB_URL no arquivo de env.')
  process.exit(1)
}

let failed = 0
function check(name: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${ok ? '' : ` — ${detail ?? ''}`}`)
  if (!ok) failed++
}

const QUERY = `
SELECT
  (SELECT count(*) FROM pg_proc
     WHERE proname='picks_open' AND pronamespace='public'::regnamespace) AS picks_open,
  (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename='match_picks' AND policyname LIKE '%no prazo%') AS mp_deadline,
  (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename='group_picks' AND policyname LIKE '%no prazo%') AS gp_deadline,
  (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename IN ('match_picks','group_picks')
       AND policyname LIKE 'Próprios %') AS old_policies,
  (CASE WHEN pg_get_functiondef('public.recalculate_leaderboard()'::regprocedure)
        LIKE '%FILTER (WHERE points_earned%' THEN 1 ELSE 0 END) AS leaderboard_fixed
`

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    const { rows } = await client.query(QUERY)
    const r = rows[0]
    console.log('\n🔎 Verificação do schema:\n')
    check('migration 004: função picks_open() existe', Number(r.picks_open) === 1, `count=${r.picks_open}`)
    check('migration 004: policies de prazo em match_picks (2)', Number(r.mp_deadline) === 2, `count=${r.mp_deadline}`)
    check('migration 004: policies de prazo em group_picks (2)', Number(r.gp_deadline) === 2, `count=${r.gp_deadline}`)
    check('migration 004: policy antiga removida', Number(r.old_policies) === 0, `restam ${r.old_policies}`)
    check('migration 005: recalculate_leaderboard sem fan-out', Number(r.leaderboard_fixed) === 1, 'ainda usa a versão antiga')
  } finally {
    await client.end()
  }
  console.log(`\n================  ${failed === 0 ? 'TUDO OK ✅' : `${failed} PROBLEMA(S) ❌`}  ================`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('💥 Erro na verificação:', err instanceof Error ? err.message : 'erro')
  process.exit(1)
})

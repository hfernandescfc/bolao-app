/**
 * Testa o trigger protect_profile_columns (migration 007) simulando os
 * contextos de JWT do PostgREST via set_config('request.jwt.claims').
 *
 * Roda TUDO dentro de uma única transação (usuários de teste incluídos) com
 * SAVEPOINT por cenário e ROLLBACK total no final — não altera nada no banco.
 *
 * Uso: npx tsx scripts/test-profile-protection.ts --env .env.staging
 */
import { Client } from 'pg'
import { loadEnv } from './load-env'

loadEnv()

const DB_URL = process.env.SUPABASE_DB_URL
if (!DB_URL) {
  console.error('❌ Faltando SUPABASE_DB_URL no arquivo de env.')
  process.exit(1)
}

let passed = 0
let failed = 0
function report(name: string, ok: boolean, detail = '') {
  if (ok) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${detail}`) }
}

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  await client.query('BEGIN')

  try {
    // Usuários de teste criados na transação (somem no ROLLBACK final).
    // O insert em auth.users dispara handle_new_user → cria profile/leaderboard.
    const mkUser = async (email: string) => {
      const { rows } = await client.query(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
                                 email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                                 created_at, updated_at)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
                 'authenticated', $1, '', now(),
                 '{"provider":"email","providers":["email"]}', '{}', now(), now())
         RETURNING id`,
        [email]
      )
      return rows[0].id as string
    }

    const participantId = await mkUser('participant-007@test.local')
    const adminId = await mkUser('admin-007@test.local')
    // Conexão direta (sem JWT) — o trigger deve permitir esta promoção.
    await client.query(`UPDATE public.profiles SET role = 'admin', is_approved = true WHERE id = $1`, [adminId])

    const asClaims = (claims: object) =>
      client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)])
    const asUser = (userId: string) => asClaims({ role: 'authenticated', sub: userId })

    type Scenario = { name: string; expectError: boolean; fn: () => Promise<boolean> }
    const scenarios: Scenario[] = [
      {
        name: 'participante NÃO consegue alterar o próprio role',
        expectError: true,
        fn: async () => {
          await asUser(participantId)
          await client.query(`UPDATE public.profiles SET role = 'admin' WHERE id = $1`, [participantId])
          return false
        },
      },
      {
        name: 'participante NÃO consegue se autoaprovar',
        expectError: true,
        fn: async () => {
          await asUser(participantId)
          await client.query(`UPDATE public.profiles SET is_approved = true WHERE id = $1`, [participantId])
          return false
        },
      },
      {
        name: 'participante ainda edita o próprio display_name',
        expectError: false,
        fn: async () => {
          await asUser(participantId)
          const r = await client.query(
            `UPDATE public.profiles SET display_name = 'novo nome' WHERE id = $1`, [participantId]
          )
          return r.rowCount === 1
        },
      },
      {
        name: 'admin aprova e promove outro usuário normalmente',
        expectError: false,
        fn: async () => {
          await asUser(adminId)
          const r1 = await client.query(
            `UPDATE public.profiles SET is_approved = true WHERE id = $1`, [participantId]
          )
          const r2 = await client.query(
            `UPDATE public.profiles SET role = 'admin' WHERE id = $1`, [participantId]
          )
          return r1.rowCount === 1 && r2.rowCount === 1
        },
      },
      {
        name: 'reinserção da própria linha com role=admin é bloqueada',
        expectError: true,
        fn: async () => {
          await asUser(participantId)
          await client.query(`DELETE FROM public.profiles WHERE id = $1`, [participantId])
          await client.query(
            `INSERT INTO public.profiles (id, display_name, email, role, is_approved)
             VALUES ($1, 'hack', 'h@h.com', 'admin', true)`, [participantId]
          )
          return false
        },
      },
      {
        name: 'service role (createAdminClient/cron) segue livre',
        expectError: false,
        fn: async () => {
          await asClaims({ role: 'service_role' })
          const r = await client.query(
            `UPDATE public.profiles SET is_approved = true, role = 'admin' WHERE id = $1`, [participantId]
          )
          return r.rowCount === 1
        },
      },
      {
        name: 'conexão direta sem JWT (signup/seed/migrations) segue livre',
        expectError: false,
        fn: async () => {
          const r = await client.query(
            `UPDATE public.profiles SET is_approved = true WHERE id = $1`, [participantId]
          )
          return r.rowCount === 1
        },
      },
    ]

    for (const s of scenarios) {
      await client.query('SAVEPOINT t')
      try {
        const ok = await s.fn()
        report(s.name, s.expectError ? false : ok, s.expectError ? '(operação passou, deveria falhar!)' : '')
      } catch (err) {
        const isTriggerError = /role\/is_approved/.test(String(err))
        report(s.name, s.expectError && isTriggerError, s.expectError ? '' : String(err))
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT t')
      }
    }
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }

  console.log(`\n${failed === 0 ? '✅' : '💥'} ${passed} ok, ${failed} falha(s)`)
  process.exit(failed === 0 ? 0 : 1)
}

run().catch((err) => {
  console.error('💥 Erro:', err instanceof Error ? err.message : err)
  process.exit(1)
})

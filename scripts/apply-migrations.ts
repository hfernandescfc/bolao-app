/**
 * Aplica TODAS as migrations de supabase/migrations/ em ordem, conectando
 * direto no Postgres do Supabase via connection string.
 *
 * Para que serve: configurar um banco novo (ex.: staging) sem precisar do
 * Docker nem do Supabase CLI — basta a connection string do projeto.
 *
 * Uso:
 *   npx tsx scripts/apply-migrations.ts --env .env.staging
 *
 * Requer no arquivo de env:
 *   SUPABASE_DB_URL=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres
 *   (Dashboard > Project Settings > Database > Connection string > URI)
 *
 * Cada arquivo .sql roda dentro de uma transação própria: se um falhar, ele
 * é revertido e o processo para, sem deixar o banco pela metade.
 */
import { Client } from 'pg'
import * as path from 'path'
import * as fs from 'fs'
import { loadEnv } from './load-env'

loadEnv()

const DB_URL = process.env.SUPABASE_DB_URL
if (!DB_URL) {
  console.error('❌ Faltando SUPABASE_DB_URL no arquivo de env.')
  console.error('   Pegue em: Dashboard > Project Settings > Database > Connection string (URI).')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations')

async function run() {
  // --only 004,005  → aplica só os arquivos cujo nome contém um desses termos.
  // Útil em produção, onde 001–003 já existem e só faltam as novas migrations.
  const onlyIdx = process.argv.indexOf('--only')
  const onlyTerms =
    onlyIdx >= 0 && process.argv[onlyIdx + 1] ? process.argv[onlyIdx + 1].split(',').map((s) => s.trim()) : null

  let files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // 001_, 002_, ... ordem lexicográfica = ordem de aplicação

  if (onlyTerms) {
    files = files.filter((f) => onlyTerms.some((term) => f.includes(term)))
    console.log(`🎯 Filtro --only: ${onlyTerms.join(', ')}`)
  }

  if (files.length === 0) {
    console.error('❌ Nenhuma migration encontrada (verifique o filtro --only).')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false }, // Supabase exige SSL
  })
  await client.connect()
  console.log(`🔗 Conectado. Aplicando ${files.length} migration(s)...\n`)

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      process.stdout.write(`  → ${file} ... `)
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('COMMIT')
        console.log('ok')
      } catch (err) {
        await client.query('ROLLBACK')
        console.log('FALHOU')
        throw err
      }
    }
    console.log('\n✅ Todas as migrations foram aplicadas com sucesso.')
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('\n💥 Erro ao aplicar migrations:', err instanceof Error ? err.message : err)
  process.exit(1)
})

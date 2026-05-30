/**
 * Carrega variáveis de ambiente de um arquivo .env escolhido por argumento.
 *
 *   tsx scripts/algo.ts                  -> usa .env.local
 *   tsx scripts/algo.ts --env .env.staging
 *
 * Centraliza o carregamento para que seed/test/migrations apontem para o
 * banco certo (produção vs. staging) sem editar código.
 */
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

export function loadEnv(): string {
  const idx = process.argv.indexOf('--env')
  const file = idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : '.env.local'
  const full = path.isAbsolute(file) ? file : path.join(process.cwd(), file)

  if (fs.existsSync(full)) {
    dotenv.config({ path: full })
    console.log(`🔐 Ambiente carregado de: ${file}`)
  } else {
    dotenv.config()
    console.warn(`⚠️  ${file} não encontrado — usando variáveis já presentes no ambiente.`)
  }
  return file
}

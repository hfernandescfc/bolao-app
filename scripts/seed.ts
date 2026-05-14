/**
 * Script de seed: busca dados da Copa 2026 no football-data.org e popula o banco.
 * Execute com: npx tsx scripts/seed.ts
 *
 * Pré-requisitos:
 *   - .env.local com FOOTBALL_DATA_API_TOKEN e SUPABASE_SERVICE_ROLE_KEY
 *   - Schema criado no Supabase (supabase/migrations/001_initial_schema.sql)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Carregar .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FD_TOKEN = process.env.FOOTBALL_DATA_API_TOKEN!

if (!SUPABASE_URL || !SERVICE_KEY || !FD_TOKEN) {
  console.error('❌ Variáveis de ambiente faltando. Verifique .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Nome em português + bandeira por código FIFA (cobre variações de TLA da API)
const TEAM_DATA: Record<string, { name: string; flag: string }> = {
  MEX: { name: 'México',           flag: '🇲🇽' },
  RSA: { name: 'África do Sul',    flag: '🇿🇦' }, ZAF: { name: 'África do Sul',    flag: '🇿🇦' },
  KOR: { name: 'Coreia do Sul',    flag: '🇰🇷' }, SKR: { name: 'Coreia do Sul',    flag: '🇰🇷' },
  CZE: { name: 'Rep. Tcheca',      flag: '🇨🇿' },
  CAN: { name: 'Canadá',           flag: '🇨🇦' },
  SUI: { name: 'Suíça',            flag: '🇨🇭' }, CHE: { name: 'Suíça',            flag: '🇨🇭' },
  QAT: { name: 'Catar',            flag: '🇶🇦' },
  BIH: { name: 'Bósnia-Herz.',     flag: '🇧🇦' },
  ARG: { name: 'Argentina',        flag: '🇦🇷' },
  CHI: { name: 'Chile',            flag: '🇨🇱' }, CHL: { name: 'Chile',            flag: '🇨🇱' },
  SRB: { name: 'Sérvia',           flag: '🇷🇸' },
  SAU: { name: 'Arábia Saudita',   flag: '🇸🇦' }, KSA: { name: 'Arábia Saudita',   flag: '🇸🇦' },
  USA: { name: 'Estados Unidos',   flag: '🇺🇸' },
  PAR: { name: 'Paraguai',         flag: '🇵🇾' }, PRY: { name: 'Paraguai',         flag: '🇵🇾' },
  AUS: { name: 'Austrália',        flag: '🇦🇺' },
  TUR: { name: 'Turquia',          flag: '🇹🇷' }, TKY: { name: 'Turquia',          flag: '🇹🇷' },
  FRA: { name: 'França',           flag: '🇫🇷' },
  BEL: { name: 'Bélgica',          flag: '🇧🇪' },
  JPN: { name: 'Japão',            flag: '🇯🇵' },
  SEN: { name: 'Senegal',          flag: '🇸🇳' },
  ESP: { name: 'Espanha',          flag: '🇪🇸' },
  COL: { name: 'Colômbia',         flag: '🇨🇴' },
  MAR: { name: 'Marrocos',         flag: '🇲🇦' },
  HUN: { name: 'Hungria',          flag: '🇭🇺' },
  BRA: { name: 'Brasil',           flag: '🇧🇷' },
  ECU: { name: 'Equador',          flag: '🇪🇨' },
  NGA: { name: 'Nigéria',          flag: '🇳🇬' },
  POL: { name: 'Polônia',          flag: '🇵🇱' },
  POR: { name: 'Portugal',         flag: '🇵🇹' },
  URU: { name: 'Uruguai',          flag: '🇺🇾' },
  IRN: { name: 'Irã',              flag: '🇮🇷' }, IRI: { name: 'Irã',              flag: '🇮🇷' },
  CIV: { name: 'Costa do Marfim',  flag: '🇨🇮' },
  ENG: { name: 'Inglaterra',       flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  NED: { name: 'Holanda',          flag: '🇳🇱' }, NDL: { name: 'Holanda',          flag: '🇳🇱' },
  GHA: { name: 'Gana',             flag: '🇬🇭' },
  SVK: { name: 'Eslováquia',       flag: '🇸🇰' },
  GER: { name: 'Alemanha',         flag: '🇩🇪' }, DEU: { name: 'Alemanha',         flag: '🇩🇪' },
  PER: { name: 'Peru',             flag: '🇵🇪' },
  IDN: { name: 'Indonésia',        flag: '🇮🇩' },
  SCO: { name: 'Escócia',          flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  ITA: { name: 'Itália',           flag: '🇮🇹' },
  VEN: { name: 'Venezuela',        flag: '🇻🇪' },
  EGY: { name: 'Egito',            flag: '🇪🇬' },
  SVN: { name: 'Eslovênia',        flag: '🇸🇮' },
  CRO: { name: 'Croácia',          flag: '🇭🇷' },
  TUN: { name: 'Tunísia',          flag: '🇹🇳' },
  JAM: { name: 'Jamaica',          flag: '🇯🇲' },
  GEO: { name: 'Geórgia',          flag: '🇬🇪' },
  // demais seleções classificadas / qualificação
  BOL: { name: 'Bolívia',          flag: '🇧🇴' },
  CRC: { name: 'Costa Rica',       flag: '🇨🇷' },
  HON: { name: 'Honduras',         flag: '🇭🇳' },
  PAN: { name: 'Panamá',           flag: '🇵🇦' },
  HAI: { name: 'Haiti',            flag: '🇭🇹' }, HTI: { name: 'Haiti',            flag: '🇭🇹' },
  CUW: { name: 'Curaçao',          flag: '🇨🇼' }, CUR: { name: 'Curaçao',          flag: '🇨🇼' },
  SWE: { name: 'Suécia',           flag: '🇸🇪' },
  CPV: { name: 'Cabo Verde',       flag: '🇨🇻' }, CAV: { name: 'Cabo Verde',       flag: '🇨🇻' },
  URY: { name: 'Uruguai',          flag: '🇺🇾' },
  NOR: { name: 'Noruega',          flag: '🇳🇴' },
  ALG: { name: 'Argélia',          flag: '🇩🇿' }, DZA: { name: 'Argélia',          flag: '🇩🇿' },
  AUT: { name: 'Áustria',          flag: '🇦🇹' },
  COD: { name: 'RD Congo',         flag: '🇨🇩' },
  COG: { name: 'Congo',            flag: '🇨🇬' }, CGO: { name: 'Congo',            flag: '🇨🇬' },
  CMR: { name: 'Camarões',         flag: '🇨🇲' },
  IRQ: { name: 'Iraque',           flag: '🇮🇶' },
  JOR: { name: 'Jordânia',         flag: '🇯🇴' },
  UZB: { name: 'Uzbequistão',      flag: '🇺🇿' },
  KWT: { name: 'Kuwait',           flag: '🇰🇼' },
  ROU: { name: 'Romênia',          flag: '🇷🇴' },
  ALB: { name: 'Albânia',          flag: '🇦🇱' },
  NZL: { name: 'Nova Zelândia',    flag: '🇳🇿' },
  FIJ: { name: 'Fiji',             flag: '🇫🇯' },
  DEN: { name: 'Dinamarca',        flag: '🇩🇰' }, DNK: { name: 'Dinamarca',        flag: '🇩🇰' },
  UKR: { name: 'Ucrânia',          flag: '🇺🇦' },
  IRL: { name: 'Irlanda',          flag: '🇮🇪' },
  WAL: { name: 'País de Gales',    flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  NIR: { name: 'Irlanda do Norte', flag: '🇬🇧' },
}

async function fetchMatches() {
  console.log('🌐 Buscando partidas da fase de grupos...')
  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026&stage=GROUP_STAGE',
    { headers: { 'X-Auth-Token': FD_TOKEN } }
  )
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  const data = await res.json()
  return data.matches as any[]
}

async function run() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  const apiMatches = await fetchMatches()
  console.log(`✓ ${apiMatches.length} partidas recebidas da API\n`)

  // Extrair grupos únicos (formato: "GROUP_A" → "A")
  const groupIds = [...new Set(apiMatches.map((m: any) => {
    const g = m.group?.replace('GROUP_', '') ?? ''
    return g
  }))].filter(Boolean).sort()

  // Inserir grupos
  console.log('📊 Inserindo grupos...')
  const groups = groupIds.map((id) => ({ id, name: `Grupo ${id}` }))
  const { error: groupErr } = await supabase.from('groups').upsert(groups)
  if (groupErr) throw groupErr
  console.log(`✓ ${groups.length} grupos inseridos`)

  // Extrair times únicos
  const teamsMap = new Map<string, { name: string; code: string; group_id: string; flag_emoji: string }>()
  for (const m of apiMatches) {
    const groupId = m.group?.replace('GROUP_', '') ?? ''
    const addTeam = (t: any) => {
      if (!t?.tla) return
      const data = TEAM_DATA[t.tla]
      teamsMap.set(t.tla, {
        name: data?.name ?? t.name ?? t.tla,
        code: t.tla,
        group_id: groupId,
        flag_emoji: data?.flag ?? '🏳️',
      })
    }
    addTeam(m.homeTeam)
    addTeam(m.awayTeam)
  }

  // Inserir times
  console.log('⚽ Inserindo times...')
  const teams = Array.from(teamsMap.values())
  const { error: teamErr } = await supabase
    .from('teams')
    .upsert(teams, { onConflict: 'code' })
  if (teamErr) throw teamErr
  console.log(`✓ ${teams.length} times inseridos`)

  // Buscar IDs dos times para mapear
  const { data: dbTeams } = await supabase.from('teams').select('id, code')
  const teamCodeToId = new Map(dbTeams!.map((t: any) => [t.code, t.id]))

  // Inserir partidas
  console.log('🗓️  Inserindo partidas...')
  const matchPayloads = apiMatches.map((m: any) => ({
    external_id: m.id,
    group_id: m.group?.replace('GROUP_', '') ?? '',
    matchday: m.matchday,
    home_team_id: teamCodeToId.get(m.homeTeam?.tla),
    away_team_id: teamCodeToId.get(m.awayTeam?.tla),
    scheduled_at: m.utcDate,
    status: 'SCHEDULED',
  })).filter((m: any) => m.home_team_id && m.away_team_id)

  const { error: matchErr } = await supabase
    .from('matches')
    .upsert(matchPayloads, { onConflict: 'external_id' })
  if (matchErr) throw matchErr
  console.log(`✓ ${matchPayloads.length} partidas inseridas`)

  console.log('\n✅ Seed concluído com sucesso!')
  console.log('\nPróximos passos:')
  console.log('  1. Crie um usuário admin pelo Supabase Dashboard > Auth > Users')
  console.log('  2. No SQL Editor, execute: UPDATE public.profiles SET role=\'admin\', is_approved=true WHERE email=\'seu@email.com\';')
  console.log('  3. Inicie o dev server: npm run dev')
}

run().catch((err) => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})

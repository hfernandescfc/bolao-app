import type { Round } from '@/types'

const BASE_URL = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'
const WC_SEASON = '2026'

const KNOCKOUT_STAGES = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL']

const STAGE_TO_ROUND: Record<string, Round> = {
  GROUP_STAGE: 'GROUP',
  LAST_32: 'R32',
  LAST_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  THIRD_PLACE: '3RD',
  FINAL: 'FINAL',
}

function getHeaders() {
  return {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN!,
  }
}

export interface ApiTeam {
  id: number | null
  name: string | null
  shortName: string | null
  tla: string | null
}

export interface ApiScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  fullTime: { home: number | null; away: number | null }
  extraTime: { home: number | null; away: number | null } | null
}

export interface ApiMatch {
  id: number
  stage: string
  status: string
  matchday: number | null
  utcDate: string
  group: string | null
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: ApiScore
}

export async function fetchGroupStageMatches(): Promise<ApiMatch[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?season=${WC_SEASON}&stage=GROUP_STAGE`,
    { headers: getHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.matches as ApiMatch[]
}

export async function fetchKnockoutMatches(): Promise<ApiMatch[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?season=${WC_SEASON}`,
    { headers: getHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return (data.matches as ApiMatch[]).filter((m) => KNOCKOUT_STAGES.includes(m.stage))
}

export async function fetchTodayMatches(): Promise<ApiMatch[]> {
  const today = new Date().toISOString().split('T')[0]
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?season=${WC_SEASON}&dateFrom=${today}&dateTo=${today}`,
    { headers: getHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.matches as ApiMatch[]
}

export function mapApiStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'SCHEDULED',
    TIMED: 'SCHEDULED',
    IN_PLAY: 'LIVE',
    PAUSED: 'PAUSED',
    FINISHED: 'FINISHED',
    POSTPONED: 'POSTPONED',
    CANCELLED: 'POSTPONED',
  }
  return map[status] ?? 'SCHEDULED'
}

export function mapApiStage(stage: string): Round {
  return STAGE_TO_ROUND[stage] ?? 'GROUP'
}

// Placar final: usa extraTime quando disponível (prorrogação), senão fullTime (90min)
export function getFinalScore(apiMatch: ApiMatch): { home: number | null; away: number | null } {
  const et = apiMatch.score.extraTime
  if (et && et.home !== null && et.away !== null) {
    return { home: et.home, away: et.away }
  }
  return apiMatch.score.fullTime
}

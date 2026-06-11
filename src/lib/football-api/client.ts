const BASE_URL = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'
const WC_SEASON = '2026'

function getHeaders() {
  return {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_TOKEN!,
  }
}

export interface ApiTeam {
  id: number
  name: string
  shortName: string
  tla: string
}

export interface ApiScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  fullTime: { home: number | null; away: number | null }
}

export interface ApiMatch {
  id: number
  status: string
  matchday: number
  utcDate: string
  group: string
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: ApiScore
}

export async function fetchGroupStageMatches(): Promise<ApiMatch[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?season=${WC_SEASON}&stage=GROUP_STAGE`,
    // no-store: placar/status são dados ao vivo — nunca servir do cache do Next.
    { headers: getHeaders(), cache: 'no-store' }
  )
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.matches as ApiMatch[]
}

export async function fetchTodayMatches(): Promise<ApiMatch[]> {
  const today = new Date().toISOString().split('T')[0]
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?season=${WC_SEASON}&stage=GROUP_STAGE&dateFrom=${today}&dateTo=${today}`,
    // no-store: placar/status são dados ao vivo — nunca servir do cache do Next.
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

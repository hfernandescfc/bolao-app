export type UserRole = 'participant' | 'admin'

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'POSTPONED'

export type Round = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | '3RD' | 'FINAL'

export interface Profile {
  id: string
  display_name: string
  email: string
  role: UserRole
  is_approved: boolean
  created_at: string
}

export interface Group {
  id: string
  name: string
}

export interface Team {
  id: number
  name: string
  code: string
  flag_emoji: string | null
  group_id: string
}

export interface Match {
  id: number
  external_id: number | null
  round: Round
  group_id: string | null
  matchday: number | null
  home_team_id: number
  away_team_id: number
  scheduled_at: string
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  score_override: boolean
  updated_at: string
  home_team?: Team
  away_team?: Team
  group?: Group
}

export interface MatchPick {
  id: number
  user_id: string
  match_id: number
  home_score: number
  away_score: number
  points_earned: number | null
  created_at: string
  updated_at: string
}

export interface GroupPick {
  id: number
  user_id: string
  group_id: string
  first_place: number
  second_place: number
  points_earned: number | null
  created_at: string
  updated_at: string
}

export interface ChampionPick {
  user_id: string
  team_id: number
  points_earned: number | null
  created_at: string
  updated_at: string
  team?: Team
}

export interface LeaderboardEntry {
  user_id: string
  match_points: number
  group_points: number
  champion_points: number
  total_points: number
  exact_score_count: number
  correct_result_count: number
  last_updated: string
  profile?: Profile
}

export interface SyncLog {
  id: number
  synced_at: string
  matches_updated: number
  triggered_by: 'cron' | 'admin'
}

// Mantido por compatibilidade com páginas que ainda referenciam (prazo já expirado)
export const PICKS_DEADLINE = new Date('2026-06-11T16:00:00Z')

// Prazo por partida: bloqueado 10 minutos antes do início
export function isMatchLocked(match: Pick<Match, 'status' | 'scheduled_at'>): boolean {
  if (match.status !== 'SCHEDULED') return true
  const deadline = new Date(match.scheduled_at)
  deadline.setMinutes(deadline.getMinutes() - 10)
  return new Date() >= deadline
}

// Palpite de campeão: vale 10 pontos e fecha no início do 2º dia da R32.
// Precisa bater com o prazo da RLS em 010_champion_pick.sql.
export const CHAMPION_POINTS = 10
export const CHAMPION_DEADLINE = new Date('2026-06-29T17:00:00Z')
export function isChampionLocked(now: Date = new Date()): boolean {
  return now >= CHAMPION_DEADLINE
}

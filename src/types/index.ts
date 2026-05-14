export type UserRole = 'participant' | 'admin'

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'POSTPONED'

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
  group_id: string
  matchday: number
  home_team_id: number
  away_team_id: number
  scheduled_at: string
  status: MatchStatus
  home_score: number | null
  away_score: number | null
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

export interface LeaderboardEntry {
  user_id: string
  match_points: number
  group_points: number
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

export const PICKS_DEADLINE = new Date('2026-06-11T16:00:00Z')

import { Match, Team, Group, LeaderboardEntry, Profile, GroupPick } from '@/types'

export const MOCK_GROUPS: Group[] = [
  { id: 'A', name: 'Grupo A' }, { id: 'B', name: 'Grupo B' },
  { id: 'C', name: 'Grupo C' }, { id: 'D', name: 'Grupo D' },
  { id: 'E', name: 'Grupo E' }, { id: 'F', name: 'Grupo F' },
  { id: 'G', name: 'Grupo G' }, { id: 'H', name: 'Grupo H' },
  { id: 'I', name: 'Grupo I' }, { id: 'J', name: 'Grupo J' },
  { id: 'K', name: 'Grupo K' }, { id: 'L', name: 'Grupo L' },
]

export const MOCK_TEAMS: Team[] = [
  // A
  { id: 1,  name: 'México',           code: 'MEX', flag_emoji: '🇲🇽', group_id: 'A' },
  { id: 2,  name: 'África do Sul',    code: 'RSA', flag_emoji: '🇿🇦', group_id: 'A' },
  { id: 3,  name: 'Coreia do Sul',    code: 'KOR', flag_emoji: '🇰🇷', group_id: 'A' },
  { id: 4,  name: 'Tchéquia',         code: 'CZE', flag_emoji: '🇨🇿', group_id: 'A' },
  // B
  { id: 5,  name: 'Canadá',           code: 'CAN', flag_emoji: '🇨🇦', group_id: 'B' },
  { id: 6,  name: 'Suíça',            code: 'SUI', flag_emoji: '🇨🇭', group_id: 'B' },
  { id: 7,  name: 'Catar',            code: 'QAT', flag_emoji: '🇶🇦', group_id: 'B' },
  { id: 8,  name: 'Bósnia-Herzegovina', code: 'BIH', flag_emoji: '🇧🇦', group_id: 'B' },
  // C
  { id: 9,  name: 'Argentina',        code: 'ARG', flag_emoji: '🇦🇷', group_id: 'C' },
  { id: 10, name: 'Chile',            code: 'CHI', flag_emoji: '🇨🇱', group_id: 'C' },
  { id: 11, name: 'Sérvia',           code: 'SRB', flag_emoji: '🇷🇸', group_id: 'C' },
  { id: 12, name: 'Arábia Saudita',   code: 'SAU', flag_emoji: '🇸🇦', group_id: 'C' },
  // D
  { id: 13, name: 'EUA',              code: 'USA', flag_emoji: '🇺🇸', group_id: 'D' },
  { id: 14, name: 'Paraguai',         code: 'PAR', flag_emoji: '🇵🇾', group_id: 'D' },
  { id: 15, name: 'Austrália',        code: 'AUS', flag_emoji: '🇦🇺', group_id: 'D' },
  { id: 16, name: 'Turquia',          code: 'TUR', flag_emoji: '🇹🇷', group_id: 'D' },
  // E
  { id: 17, name: 'França',           code: 'FRA', flag_emoji: '🇫🇷', group_id: 'E' },
  { id: 18, name: 'Bélgica',          code: 'BEL', flag_emoji: '🇧🇪', group_id: 'E' },
  { id: 19, name: 'Japão',            code: 'JPN', flag_emoji: '🇯🇵', group_id: 'E' },
  { id: 20, name: 'Senegal',          code: 'SEN', flag_emoji: '🇸🇳', group_id: 'E' },
  // F
  { id: 21, name: 'Espanha',          code: 'ESP', flag_emoji: '🇪🇸', group_id: 'F' },
  { id: 22, name: 'Colômbia',         code: 'COL', flag_emoji: '🇨🇴', group_id: 'F' },
  { id: 23, name: 'Marrocos',         code: 'MAR', flag_emoji: '🇲🇦', group_id: 'F' },
  { id: 24, name: 'Hungria',          code: 'HUN', flag_emoji: '🇭🇺', group_id: 'F' },
  // G
  { id: 25, name: 'Brasil',           code: 'BRA', flag_emoji: '🇧🇷', group_id: 'G' },
  { id: 26, name: 'Equador',          code: 'ECU', flag_emoji: '🇪🇨', group_id: 'G' },
  { id: 27, name: 'Nigéria',          code: 'NGA', flag_emoji: '🇳🇬', group_id: 'G' },
  { id: 28, name: 'Polônia',          code: 'POL', flag_emoji: '🇵🇱', group_id: 'G' },
  // H
  { id: 29, name: 'Portugal',         code: 'POR', flag_emoji: '🇵🇹', group_id: 'H' },
  { id: 30, name: 'Uruguai',          code: 'URU', flag_emoji: '🇺🇾', group_id: 'H' },
  { id: 31, name: 'Irã',              code: 'IRN', flag_emoji: '🇮🇷', group_id: 'H' },
  { id: 32, name: 'Costa do Marfim',  code: 'CIV', flag_emoji: '🇨🇮', group_id: 'H' },
  // I
  { id: 33, name: 'Inglaterra',       code: 'ENG', flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group_id: 'I' },
  { id: 34, name: 'Holanda',          code: 'NED', flag_emoji: '🇳🇱', group_id: 'I' },
  { id: 35, name: 'Gana',             code: 'GHA', flag_emoji: '🇬🇭', group_id: 'I' },
  { id: 36, name: 'Eslováquia',       code: 'SVK', flag_emoji: '🇸🇰', group_id: 'I' },
  // J
  { id: 37, name: 'Alemanha',         code: 'GER', flag_emoji: '🇩🇪', group_id: 'J' },
  { id: 38, name: 'Peru',             code: 'PER', flag_emoji: '🇵🇪', group_id: 'J' },
  { id: 39, name: 'Indonésia',        code: 'IDN', flag_emoji: '🇮🇩', group_id: 'J' },
  { id: 40, name: 'Escócia',          code: 'SCO', flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group_id: 'J' },
  // K
  { id: 41, name: 'Itália',           code: 'ITA', flag_emoji: '🇮🇹', group_id: 'K' },
  { id: 42, name: 'Venezuela',        code: 'VEN', flag_emoji: '🇻🇪', group_id: 'K' },
  { id: 43, name: 'Egito',            code: 'EGY', flag_emoji: '🇪🇬', group_id: 'K' },
  { id: 44, name: 'Eslovênia',        code: 'SVN', flag_emoji: '🇸🇮', group_id: 'K' },
  // L
  { id: 45, name: 'Croácia',          code: 'CRO', flag_emoji: '🇭🇷', group_id: 'L' },
  { id: 46, name: 'Tunísia',          code: 'TUN', flag_emoji: '🇹🇳', group_id: 'L' },
  { id: 47, name: 'Jamaica',          code: 'JAM', flag_emoji: '🇯🇲', group_id: 'L' },
  { id: 48, name: 'Geórgia',          code: 'GEO', flag_emoji: '🇬🇪', group_id: 'L' },
]

function makeMatch(
  id: number, homeId: number, awayId: number,
  groupId: string, matchday: number, date: string,
  status: string = 'SCHEDULED',
  homeScore: number | null = null,
  awayScore: number | null = null
): Match {
  const home = MOCK_TEAMS.find(t => t.id === homeId)!
  const away = MOCK_TEAMS.find(t => t.id === awayId)!
  return {
    id, external_id: id, round: 'GROUP' as const, group_id: groupId, matchday,
    home_team_id: homeId, away_team_id: awayId,
    scheduled_at: date, status: status as Match['status'],
    home_score: homeScore, away_score: awayScore, score_override: false,
    updated_at: date, home_team: home, away_team: away,
  }
}

export const MOCK_MATCHES: Match[] = [
  // Grupo A
  makeMatch(1,  1, 2, 'A', 1, '2026-06-11T16:00:00Z'),
  makeMatch(2,  3, 4, 'A', 1, '2026-06-11T22:00:00Z'),
  makeMatch(3,  1, 4, 'A', 2, '2026-06-15T16:00:00Z'),
  makeMatch(4,  2, 3, 'A', 2, '2026-06-15T19:00:00Z'),
  makeMatch(5,  1, 3, 'A', 3, '2026-06-19T22:00:00Z'),
  makeMatch(6,  4, 2, 'A', 3, '2026-06-19T22:00:00Z'),
  // Grupo B
  makeMatch(7,  5, 6, 'B', 1, '2026-06-12T16:00:00Z'),
  makeMatch(8,  7, 8, 'B', 1, '2026-06-12T22:00:00Z'),
  makeMatch(9,  5, 8, 'B', 2, '2026-06-16T16:00:00Z'),
  makeMatch(10, 6, 7, 'B', 2, '2026-06-16T19:00:00Z'),
  makeMatch(11, 5, 7, 'B', 3, '2026-06-20T22:00:00Z'),
  makeMatch(12, 8, 6, 'B', 3, '2026-06-20T22:00:00Z'),
  // Grupo C
  makeMatch(13, 9, 10, 'C', 1, '2026-06-12T19:00:00Z'),
  makeMatch(14,11, 12, 'C', 1, '2026-06-13T16:00:00Z'),
  makeMatch(15, 9, 12, 'C', 2, '2026-06-16T22:00:00Z'),
  makeMatch(16,10, 11, 'C', 2, '2026-06-17T16:00:00Z'),
  makeMatch(17, 9, 11, 'C', 3, '2026-06-21T22:00:00Z'),
  makeMatch(18,12, 10, 'C', 3, '2026-06-21T22:00:00Z'),
  // Grupo D
  makeMatch(19,13, 14, 'D', 1, '2026-06-13T19:00:00Z'),
  makeMatch(20,15, 16, 'D', 1, '2026-06-13T22:00:00Z'),
  makeMatch(21,13, 16, 'D', 2, '2026-06-17T19:00:00Z'),
  makeMatch(22,14, 15, 'D', 2, '2026-06-17T22:00:00Z'),
  makeMatch(23,13, 15, 'D', 3, '2026-06-22T22:00:00Z'),
  makeMatch(24,16, 14, 'D', 3, '2026-06-22T22:00:00Z'),
  // Grupo E
  makeMatch(25,17, 18, 'E', 1, '2026-06-14T16:00:00Z'),
  makeMatch(26,19, 20, 'E', 1, '2026-06-14T19:00:00Z'),
  makeMatch(27,17, 20, 'E', 2, '2026-06-18T16:00:00Z'),
  makeMatch(28,18, 19, 'E', 2, '2026-06-18T19:00:00Z'),
  makeMatch(29,17, 19, 'E', 3, '2026-06-22T18:00:00Z'),
  makeMatch(30,20, 18, 'E', 3, '2026-06-22T18:00:00Z'),
  // Grupo F
  makeMatch(31,21, 22, 'F', 1, '2026-06-14T22:00:00Z'),
  makeMatch(32,23, 24, 'F', 1, '2026-06-15T16:00:00Z'),
  makeMatch(33,21, 24, 'F', 2, '2026-06-18T22:00:00Z'),
  makeMatch(34,22, 23, 'F', 2, '2026-06-19T16:00:00Z'),
  makeMatch(35,21, 23, 'F', 3, '2026-06-23T22:00:00Z'),
  makeMatch(36,24, 22, 'F', 3, '2026-06-23T22:00:00Z'),
  // Grupo G
  makeMatch(37,25, 26, 'G', 1, '2026-06-15T22:00:00Z'),
  makeMatch(38,27, 28, 'G', 1, '2026-06-16T16:00:00Z'),
  makeMatch(39,25, 28, 'G', 2, '2026-06-19T19:00:00Z'),
  makeMatch(40,26, 27, 'G', 2, '2026-06-19T22:00:00Z', 'FINISHED', 1, 1),
  makeMatch(41,25, 27, 'G', 3, '2026-06-24T22:00:00Z', 'FINISHED', 3, 0),
  makeMatch(42,28, 26, 'G', 3, '2026-06-24T22:00:00Z', 'FINISHED', 0, 2),
  // Grupo H
  makeMatch(43,29, 30, 'H', 1, '2026-06-16T22:00:00Z'),
  makeMatch(44,31, 32, 'H', 1, '2026-06-17T16:00:00Z'),
  makeMatch(45,29, 32, 'H', 2, '2026-06-20T16:00:00Z'),
  makeMatch(46,30, 31, 'H', 2, '2026-06-20T19:00:00Z'),
  makeMatch(47,29, 31, 'H', 3, '2026-06-25T22:00:00Z'),
  makeMatch(48,32, 30, 'H', 3, '2026-06-25T22:00:00Z'),
  // Grupo I
  makeMatch(49,33, 34, 'I', 1, '2026-06-17T22:00:00Z'),
  makeMatch(50,35, 36, 'I', 1, '2026-06-18T16:00:00Z'),
  makeMatch(51,33, 36, 'I', 2, '2026-06-21T16:00:00Z'),
  makeMatch(52,34, 35, 'I', 2, '2026-06-21T19:00:00Z'),
  makeMatch(53,33, 35, 'I', 3, '2026-06-26T22:00:00Z'),
  makeMatch(54,36, 34, 'I', 3, '2026-06-26T22:00:00Z'),
  // Grupo J
  makeMatch(55,37, 38, 'J', 1, '2026-06-18T22:00:00Z'),
  makeMatch(56,39, 40, 'J', 1, '2026-06-18T19:00:00Z'),
  makeMatch(57,37, 40, 'J', 2, '2026-06-22T16:00:00Z'),
  makeMatch(58,38, 39, 'J', 2, '2026-06-22T19:00:00Z'),
  makeMatch(59,37, 39, 'J', 3, '2026-06-26T18:00:00Z'),
  makeMatch(60,40, 38, 'J', 3, '2026-06-26T18:00:00Z'),
  // Grupo K
  makeMatch(61,41, 42, 'K', 1, '2026-06-19T16:00:00Z'),
  makeMatch(62,43, 44, 'K', 1, '2026-06-19T19:00:00Z'),
  makeMatch(63,41, 44, 'K', 2, '2026-06-23T16:00:00Z'),
  makeMatch(64,42, 43, 'K', 2, '2026-06-23T19:00:00Z'),
  makeMatch(65,41, 43, 'K', 3, '2026-06-27T18:00:00Z'),
  makeMatch(66,44, 42, 'K', 3, '2026-06-27T18:00:00Z'),
  // Grupo L
  makeMatch(67,45, 46, 'L', 1, '2026-06-20T22:00:00Z'),
  makeMatch(68,47, 48, 'L', 1, '2026-06-20T16:00:00Z'),
  makeMatch(69,45, 48, 'L', 2, '2026-06-24T16:00:00Z'),
  makeMatch(70,46, 47, 'L', 2, '2026-06-24T19:00:00Z'),
  makeMatch(71,45, 47, 'L', 3, '2026-06-27T22:00:00Z'),
  makeMatch(72,48, 46, 'L', 3, '2026-06-27T22:00:00Z'),
]

const mockProfiles: Profile[] = [
  { id: 'u1', display_name: 'João',    email: 'joao@familia.com',    role: 'admin',       is_approved: true, created_at: '' },
  { id: 'u2', display_name: 'Maria',   email: 'maria@familia.com',   role: 'participant', is_approved: true, created_at: '' },
  { id: 'u3', display_name: 'Pedro',   email: 'pedro@familia.com',   role: 'participant', is_approved: true, created_at: '' },
  { id: 'u4', display_name: 'Ana',     email: 'ana@familia.com',     role: 'participant', is_approved: true, created_at: '' },
  { id: 'u5', display_name: 'Carlos',  email: 'carlos@familia.com',  role: 'participant', is_approved: true, created_at: '' },
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { user_id: 'u2', match_points: 18, group_points: 6, champion_points: 0, total_points: 24, exact_score_count: 4, correct_result_count: 6, last_updated: '', profile: mockProfiles[1] },
  { user_id: 'u1', match_points: 15, group_points: 8, champion_points: 0, total_points: 23, exact_score_count: 3, correct_result_count: 6, last_updated: '', profile: mockProfiles[0] },
  { user_id: 'u3', match_points: 12, group_points: 6, champion_points: 0, total_points: 18, exact_score_count: 2, correct_result_count: 6, last_updated: '', profile: mockProfiles[2] },
  { user_id: 'u4', match_points:  9, group_points: 4, champion_points: 0, total_points: 13, exact_score_count: 1, correct_result_count: 6, last_updated: '', profile: mockProfiles[3] },
  { user_id: 'u5', match_points:  6, group_points: 2, champion_points: 0, total_points:  8, exact_score_count: 0, correct_result_count: 6, last_updated: '', profile: mockProfiles[4] },
]

export const DEMO_USER_ID = 'u1'
export const DEMO_USER_NAME = 'João'

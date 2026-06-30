import { createAdminClient } from '@/lib/supabase/server'
import { OverrideScoreForm } from './OverrideScoreForm'

export default async function CorrigirPlacarPage() {
  const supabase = createAdminClient()

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('id, home_score, away_score, score_override, scheduled_at, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .eq('status', 'FINISHED')
    .order('scheduled_at', { ascending: false })

  const matches = (matchesRaw ?? []).map((m) => ({
    id: m.id as number,
    home_score: m.home_score as number | null,
    away_score: m.away_score as number | null,
    score_override: m.score_override as boolean,
    scheduled_at: m.scheduled_at as string,
    home_team: (m.home_team as unknown as { name: string } | null)?.name ?? '?',
    away_team: (m.away_team as unknown as { name: string } | null)?.name ?? '?',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Corrigir Placar</h1>
      <p className="text-sm text-gray-600">
        Use quando a API retornar um placar errado. O jogo corrigido fica protegido contra sobrescrita pelo sync automático.
      </p>
      <OverrideScoreForm matches={matches} />
    </div>
  )
}

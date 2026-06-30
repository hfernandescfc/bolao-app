import { createAdminClient } from '@/lib/supabase/server'
import { SetPickForm } from './SetPickForm'

export default async function PalpiteManualPage() {
  const supabase = createAdminClient()

  const [{ data: profilesRaw }, { data: matchesRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('is_approved', true)
      .order('display_name'),
    supabase
      .from('matches')
      .select('id, status, scheduled_at, home_score, away_score, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .neq('round', 'GROUP')
      .order('scheduled_at', { ascending: true }),
  ])

  const users = (profilesRaw ?? []).map((p) => ({
    id: p.id as string,
    display_name: p.display_name as string,
    email: p.email as string,
  }))

  const matches = (matchesRaw ?? []).map((m) => ({
    id: m.id as number,
    status: m.status as string,
    scheduled_at: m.scheduled_at as string,
    home_score: m.home_score as number | null,
    away_score: m.away_score as number | null,
    home_team: (m.home_team as unknown as { name: string } | null)?.name ?? '?',
    away_team: (m.away_team as unknown as { name: string } | null)?.name ?? '?',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Palpite Manual</h1>
        <p className="text-sm text-gray-600 mt-1">
          Insere ou substitui o palpite de um participante. Use quando o usuário enviou o palpite fora do app antes do prazo.
        </p>
      </div>
      <SetPickForm users={users} matches={matches} />
    </div>
  )
}

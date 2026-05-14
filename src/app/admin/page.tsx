import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: usersCount },
    { count: picksCount },
    { count: groupPicksCount },
    { data: lastSync },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('match_picks').select('*', { count: 'exact', head: true }),
    supabase.from('group_picks').select('*', { count: 'exact', head: true }),
    supabase.from('sync_log').select('*').order('synced_at', { ascending: false }).limit(1).single(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Painel Admin</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-gray-900">{usersCount ?? 0}</p>
            <p className="text-sm text-gray-500">Participantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-gray-900">{picksCount ?? 0}</p>
            <p className="text-sm text-gray-500">Palpites de partidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-gray-900">{groupPicksCount ?? 0}</p>
            <p className="text-sm text-gray-500">Palpites de grupos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-gray-900">Último sync</p>
            <p className="text-xs text-gray-500 mt-1">
              {lastSync?.synced_at
                ? new Date(lastSync.synced_at).toLocaleString('pt-BR')
                : 'Nunca sincronizado'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Início da Copa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-700">
            {Math.max(0, Math.ceil((new Date('2026-06-11T16:00:00Z').getTime() - Date.now()) / 86400000))} dias
          </p>
          <p className="text-xs text-gray-500">até 11 de junho de 2026 (México x África do Sul)</p>
        </CardContent>
      </Card>
    </div>
  )
}

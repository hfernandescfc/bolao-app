import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/paginate'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface UserRow {
  id: string
  display_name: string
  email: string
  matchCount: number
  groupCount: number
}

export default async function AdminFillingPage() {
  // Leitura agregada de todos os participantes — precisa enxergar além do
  // próprio usuário, por isso usa o service role (sem sessão), ignorando a RLS.
  const admin = createAdminClient()

  // `match_picks`/`group_picks` são lidas POR INTEIRO para contar por usuário.
  // Sem paginar, o limite de 1000 linhas do PostgREST trunca em silêncio (72
  // jogos × ~14 participantes já passam de 1000) e palpites "somem" da tela.
  const [
    { data: profilesRaw },
    matchPicksRaw,
    groupPicksRaw,
    { count: matchesTotal },
    { count: groupsTotal },
  ] = await Promise.all([
    admin.from('profiles').select('id, display_name, email, is_approved').eq('is_approved', true).order('display_name'),
    fetchAllRows<{ user_id: string }>(() => admin.from('match_picks').select('user_id')),
    fetchAllRows<{ user_id: string }>(() => admin.from('group_picks').select('user_id')),
    admin.from('matches').select('*', { count: 'exact', head: true }),
    admin.from('groups').select('*', { count: 'exact', head: true }),
  ])

  const matchTotal = matchesTotal ?? 0
  const groupTotal = groupsTotal ?? 0

  const mpByUser = new Map<string, number>()
  for (const r of matchPicksRaw) mpByUser.set(r.user_id, (mpByUser.get(r.user_id) ?? 0) + 1)
  const gpByUser = new Map<string, number>()
  for (const r of groupPicksRaw) gpByUser.set(r.user_id, (gpByUser.get(r.user_id) ?? 0) + 1)

  const isComplete = (u: UserRow) =>
    matchTotal > 0 && u.matchCount >= matchTotal && groupTotal > 0 && u.groupCount >= groupTotal

  const rows: UserRow[] = (profilesRaw ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    email: p.email,
    matchCount: mpByUser.get(p.id) ?? 0,
    groupCount: gpByUser.get(p.id) ?? 0,
  }))

  // Incompletos primeiro (quem falta mais aparece no topo), depois por nome.
  rows.sort((a, b) => {
    const ra = (matchTotal - a.matchCount) + (groupTotal - a.groupCount)
    const rb = (matchTotal - b.matchCount) + (groupTotal - b.groupCount)
    if (rb !== ra) return rb - ra
    return a.display_name.localeCompare(b.display_name, 'pt-BR')
  })

  const completeCount = rows.filter(isComplete).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Preenchimento dos palpites</h1>
        <p className="text-xs text-gray-500 mt-1">
          Quantos palpites cada participante já preencheu. Total: {matchTotal} partidas e {groupTotal} grupos.
        </p>
      </div>

      <div className="text-sm text-gray-600">
        <span className="font-semibold text-green-700">{completeCount}</span> de {rows.length} completaram tudo
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Nenhum participante aprovado ainda.</p>
        )}
        {rows.map((u) => {
          const done = isComplete(u)
          return (
            <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{u.display_name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {done && (
                  <Badge className="text-[10px] py-0 bg-green-600 shrink-0 inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Completo
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ProgressBit label="Partidas" filled={u.matchCount} total={matchTotal} />
                <ProgressBit label="Grupos" filled={u.groupCount} total={groupTotal} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProgressBit({ label, filled, total }: { label: string; filled: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (filled / total) * 100) : 0
  const done = total > 0 && filled >= total
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${done ? 'text-green-700' : filled > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
          {filled}/{total}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${done ? 'bg-green-600' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

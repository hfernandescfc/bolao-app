import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupCard } from '@/components/groups/GroupCard'
import { Group, Team, GroupPick, PICKS_DEADLINE } from '@/types'

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: groupsRaw }, { data: teamsRaw }, { data: picksRaw }] = await Promise.all([
    supabase.from('groups').select('*').order('id'),
    supabase.from('teams').select('*').order('name'),
    supabase.from('group_picks').select('*').eq('user_id', user.id),
  ])

  const groups = (groupsRaw ?? []) as Group[]
  const teams = (teamsRaw ?? []) as Team[]
  const picks: Record<string, GroupPick> = {}
  for (const p of picksRaw ?? []) {
    picks[p.group_id] = p as GroupPick
  }

  const teamsByGroup: Record<string, Team[]> = {}
  for (const team of teams) {
    if (!teamsByGroup[team.group_id]) teamsByGroup[team.group_id] = []
    teamsByGroup[team.group_id].push(team)
  }

  const isDeadlinePassed = new Date() >= PICKS_DEADLINE
  const filledCount = Object.keys(picks).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Palpites — Grupos</h1>
        {isDeadlinePassed && (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Prazo encerrado
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{filledCount}/12 grupos preenchidos</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${(filledCount / 12) * 100}%` }}
          />
        </div>
      </div>

      {!isDeadlinePassed && (
        <p className="text-xs text-gray-500 mb-4">
          Escolha os 2 times classificados de cada grupo (posição não importa).
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          Os grupos serão carregados em breve.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              teams={teamsByGroup[group.id] ?? []}
              pick={picks[group.id] ?? null}
              isDeadlinePassed={isDeadlinePassed}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupList } from '@/components/groups/GroupList'
import { Group, Team, GroupPick, PICKS_DEADLINE } from '@/types'
import { getT } from '@/lib/i18n/server'

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [[{ data: groupsRaw }, { data: teamsRaw }, { data: picksRaw }], t] = await Promise.all([
    Promise.all([
      supabase.from('groups').select('*').order('id'),
      supabase.from('teams').select('*').order('name'),
      supabase.from('group_picks').select('*').eq('user_id', user.id),
    ]),
    getT(),
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t.groups.title}</h1>
        {isDeadlinePassed && (
          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            {t.groups.deadlinePassed}
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-gray-400 py-12">{t.groups.empty}</p>
      ) : (
        <GroupList
          groups={groups}
          teamsByGroup={teamsByGroup}
          picks={picks}
          isDeadlinePassed={isDeadlinePassed}
          userId={user.id}
        />
      )}
    </div>
  )
}

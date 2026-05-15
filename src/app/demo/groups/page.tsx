'use client'

import { MOCK_GROUPS, MOCK_TEAMS } from '@/lib/mock/data'
import { DemoGroupList } from '@/components/groups/DemoGroupList'
import { Team } from '@/types'
import { useT } from '@/lib/i18n/context'

export default function DemoGroupsPage() {
  const t = useT()
  const teamsByGroup: Record<string, Team[]> = {}
  for (const team of MOCK_TEAMS) {
    if (!teamsByGroup[team.group_id]) teamsByGroup[team.group_id] = []
    teamsByGroup[team.group_id].push(team)
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t.groups.title}</h1>
        <p className="text-xs text-gray-500 mt-1">{t.demo.groupsHint}</p>
      </div>
      <DemoGroupList groups={MOCK_GROUPS} teamsByGroup={teamsByGroup} />
    </div>
  )
}

'use client'

import { MOCK_MATCHES } from '@/lib/mock/data'
import { DemoMatchList } from '@/components/matches/DemoMatchList'
import { useT } from '@/lib/i18n/context'

export default function DemoMatchesPage() {
  const t = useT()
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">{t.matches.title}</h1>
      </div>
      <p className="text-xs text-gray-500 mb-4">{t.demo.matchesHint}</p>
      <DemoMatchList matches={MOCK_MATCHES} />
    </div>
  )
}

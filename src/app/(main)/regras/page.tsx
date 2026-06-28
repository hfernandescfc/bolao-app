import Link from 'next/link'
import { ArrowLeft, CalendarClock, Target, Crown, Trophy, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getT } from '@/lib/i18n/server'

export default async function RulesPage() {
  const t = await getT()
  const r = t.rules

  return (
    <div className="space-y-4">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline mb-2">
          <ArrowLeft size={14} /> {r.back}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{r.title}</h1>
        <p className="text-xs text-gray-500 mt-1">{r.subtitle}</p>
      </div>

      <RuleCard icon={CalendarClock} title={r.deadlineTitle}>
        <p>{r.deadlineText}</p>
      </RuleCard>

      <RuleCard icon={Target} title={r.matchTitle}>
        <p className="mb-2">{r.matchText}</p>
        <ul className="space-y-1">
          <Bullet color="bg-green-600">{r.matchExact}</Bullet>
          <Bullet color="bg-yellow-500">{r.matchResult}</Bullet>
          <Bullet color="bg-gray-300">{r.matchMiss}</Bullet>
        </ul>
      </RuleCard>

      <RuleCard icon={Crown} title={r.championTitle}>
        <p>{r.championText}</p>
      </RuleCard>

      <RuleCard icon={Trophy} title={r.rankingTitle}>
        <p>{r.rankingText}</p>
      </RuleCard>

      <RuleCard icon={Info} title={r.noteTitle}>
        <p>{r.noteText}</p>
      </RuleCard>
    </div>
  )
}

function RuleCard({
  icon: Icon, title, children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-800 flex items-center gap-2">
          <Icon size={16} className="text-green-700" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600 leading-relaxed">{children}</CardContent>
    </Card>
  )
}

function Bullet({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${color}`} />
      <span>{children}</span>
    </li>
  )
}

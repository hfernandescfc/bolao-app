'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, ListOrdered, Shield, User } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function BottomNav() {
  const pathname = usePathname()
  const t = useT()

  const navItems = [
    { href: '/demo', label: t.nav.ranking, icon: BarChart3 },
    { href: '/demo/matches', label: t.nav.matches, icon: CalendarDays },
    { href: '/demo/groups', label: t.nav.groups, icon: Shield },
    { href: '/demo/my-standings', label: t.nav.table, icon: ListOrdered },
    { href: '/demo/my-picks', label: t.nav.mine, icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors ${
                isActive ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

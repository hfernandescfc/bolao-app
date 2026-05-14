'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, ListOrdered, Shield, Trophy, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Ranking', icon: BarChart3 },
  { href: '/matches', label: 'Partidas', icon: CalendarDays },
  { href: '/groups', label: 'Grupos', icon: Shield },
  { href: '/my-standings', label: 'Tabela', icon: ListOrdered },
  { href: '/my-picks', label: 'Meus', icon: User },
]

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const allItems = isAdmin
    ? [...navItems, { href: '/admin', label: 'Admin', icon: Trophy }]
    : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {allItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-green-700'
                  : 'text-gray-400 hover:text-gray-600'
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

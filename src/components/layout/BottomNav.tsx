'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, Crown, Trophy, User } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const t = useT()

  // Fase eliminatória: as abas de grupos (palpites e tabela) saíram da navegação
  // porque a fase de grupos encerrou. As páginas seguem acessíveis por URL.
  const navItems = [
    { href: '/dashboard', label: t.nav.ranking, icon: BarChart3 },
    { href: '/matches', label: t.nav.matches, icon: CalendarDays },
    { href: '/campeao', label: t.nav.champion, icon: Crown },
    { href: '/my-picks', label: t.nav.mine, icon: User },
  ]

  const allItems = isAdmin
    ? [...navItems, { href: '/admin', label: t.nav.admin, icon: Trophy }]
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

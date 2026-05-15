'use client'

import Link from 'next/link'
import { BottomNav } from '@/components/layout/DemoBottomNav'
import { useT, useLocale } from '@/lib/i18n/context'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const t = useT()
  const { locale, toggleLocale } = useLocale()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-amber-500 text-amber-950 text-center py-1.5 px-4 text-xs font-medium">
        {t.demo.banner}{' '}
        <Link href="/login" className="underline font-bold">{t.demo.login}</Link>
      </div>

      <header className="sticky top-0 z-40 bg-green-800 text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-bold text-sm">{t.app.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="text-xs font-semibold text-green-200 hover:text-white transition-colors"
            >
              {locale === 'pt' ? 'EN' : 'PT'}
            </button>
            <span className="text-sm text-green-200">{t.demo.user}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full pb-20 px-4 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}

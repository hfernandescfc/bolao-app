'use client'

import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { useT, useLocale } from '@/lib/i18n/context'

export function Navbar({ displayName }: { displayName: string }) {
  const t = useT()
  const { locale, toggleLocale } = useLocale()

  return (
    <header className="sticky top-0 z-40 bg-green-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-sm">{t.app.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-200 hidden sm:block">{displayName}</span>
          <button
            onClick={toggleLocale}
            className="text-xs font-bold text-green-200 hover:text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
            title={locale === 'pt' ? 'Switch to English' : 'Mudar para Português'}
          >
            {locale === 'pt' ? 'EN' : 'PT'}
          </button>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-green-200 hover:text-white hover:bg-green-700 h-8 text-xs"
            >
              {t.nav.signOut}
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

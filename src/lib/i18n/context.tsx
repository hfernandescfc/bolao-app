'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { translations, type Locale, type Translations } from './translations'

interface LanguageContextType {
  locale: Locale
  t: Translations
  toggleLocale: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const router = useRouter()

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === 'pt' ? 'en' : 'pt'
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`
    setLocale(next)
    router.refresh()
  }, [locale, router])

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT(): Translations {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useT must be used within LanguageProvider')
  return ctx.t
}

export function useLocale(): { locale: Locale; toggleLocale: () => void } {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLocale must be used within LanguageProvider')
  return { locale: ctx.locale, toggleLocale: ctx.toggleLocale }
}

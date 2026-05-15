import { cookies } from 'next/headers'
import { translations, type Locale, type Translations } from './translations'

export async function getLocale(): Promise<Locale> {
  const c = await cookies()
  const val = c.get('locale')?.value
  return val === 'en' ? 'en' : 'pt'
}

export async function getT(): Promise<Translations> {
  const locale = await getLocale()
  return translations[locale]
}

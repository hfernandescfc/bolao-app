'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/lib/i18n/context'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = useT()
  const s = t.auth.register

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{t.app.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{s.subtitle}</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="display_name">{s.nameLabel}</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              placeholder={s.namePlaceholder}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">{s.emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={s.emailPlaceholder}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">{s.passwordLabel}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={s.passwordPlaceholder}
              required
              minLength={8}
              className="mt-1"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? s.submitting : s.submit}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {s.hasAccount}{' '}
          <Link href="/login" className="text-green-700 font-medium hover:underline">
            {s.signIn}
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">{s.notice}</p>
      </div>
    </div>
  )
}

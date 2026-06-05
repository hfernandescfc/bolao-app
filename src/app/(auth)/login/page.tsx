'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/lib/i18n/context'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = useT()
  const s = t.auth.signIn

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{s.passwordLabel}</Label>
              <Link href="/forgot-password" className="text-xs text-green-700 hover:underline">
                {t.auth.forgotPassword.link}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={s.passwordPlaceholder}
              required
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

        <GoogleButton />

        <p className="text-center text-sm text-gray-500 mt-6">
          {s.noAccount}{' '}
          <Link href="/register" className="text-green-700 font-medium hover:underline">
            {s.register}
          </Link>
        </p>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Link href="/demo" className="text-xs text-amber-600 hover:underline font-medium">
            {s.demo}
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/lib/i18n/context'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = useT()
  const s = t.auth.resetPassword

  function handleSubmit(formData: FormData) {
    setError(null)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError(s.mismatch)
      return
    }
    if (password.length < 8) {
      setError(s.mismatch)
      return
    }

    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) setError(s.error)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{s.subtitle}</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
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
          <div>
            <Label htmlFor="confirm">{s.confirmLabel}</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder={s.confirmPlaceholder}
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
      </div>
    </div>
  )
}

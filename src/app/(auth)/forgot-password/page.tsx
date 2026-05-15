'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { sendPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useT } from '@/lib/i18n/context'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useT()
  const s = t.auth.forgotPassword

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await sendPasswordReset(formData)
      setSent(true)
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

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-700 bg-green-50 p-4 rounded-lg font-medium">
              {s.success}
            </p>
            <Link href="/login" className="text-sm text-green-700 hover:underline font-medium block">
              {s.backToLogin}
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{s.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? s.submitting : s.submit}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:underline">
                {s.backToLogin}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

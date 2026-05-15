import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

export default async function AguardandoAprovacaoPage() {
  const t = await getT()
  const s = t.auth.pending

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{s.title}</h1>
        <p className="text-gray-600 mb-6">{s.body}</p>
        <p className="text-sm text-gray-400 mb-8">{s.hint}</p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            {s.signOut}
          </Button>
        </form>
      </div>
    </div>
  )
}

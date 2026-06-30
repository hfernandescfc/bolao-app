import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar displayName={profile.display_name} />
      <nav className="bg-green-900 text-white">
        <div className="flex gap-0 max-w-lg mx-auto text-sm">
          {[
            { href: '/admin', label: 'Visão Geral' },
            { href: '/admin/users', label: 'Usuários' },
            { href: '/admin/preenchimento', label: 'Preenchimento' },
            { href: '/admin/sync', label: 'Sync API' },
            { href: '/admin/corrigir-placar', label: 'Corrigir Placar' },
            { href: '/admin/palpite-manual', label: 'Palpite Manual' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2.5 hover:bg-green-700 transition-colors text-xs font-medium"
            >
              {label}
            </Link>
          ))}
          <Link href="/dashboard" className="px-4 py-2.5 hover:bg-green-700 transition-colors text-xs text-green-300">
            ← App
          </Link>
        </div>
      </nav>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}

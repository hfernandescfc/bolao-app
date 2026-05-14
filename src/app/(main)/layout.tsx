import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, is_approved')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) redirect('/aguardando-aprovacao')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar displayName={profile.display_name} />
      <main className="flex-1 max-w-lg mx-auto w-full pb-20 px-4 pt-4">
        {children}
      </main>
      <BottomNav isAdmin={profile.role === 'admin'} />
    </div>
  )
}

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Profile } from '@/types'

async function toggleApproval(userId: string, approve: boolean) {
  'use server'
  const supabase = await createServiceClient()
  await supabase.from('profiles').update({ is_approved: approve }).eq('id', userId)
  revalidatePath('/admin/users')
}

async function setRole(userId: string, role: string) {
  'use server'
  const supabase = await createServiceClient()
  await supabase.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const users = (profiles ?? []) as Profile[]
  const pending = users.filter((u) => !u.is_approved)
  const approved = users.filter((u) => u.is_approved)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Gerenciar Usuários</h1>

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-orange-600 mb-2">
            ⏳ Aguardando aprovação ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((u) => (
              <div key={u.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{u.display_name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <form action={toggleApproval.bind(null, u.id, true)}>
                  <Button size="sm" className="bg-green-700 hover:bg-green-800">
                    Aprovar
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Aprovados ({approved.length})
        </h2>
        <div className="space-y-2">
          {approved.map((u) => (
            <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{u.display_name}</p>
                  {u.role === 'admin' && (
                    <Badge className="text-[10px] py-0 bg-green-700">Admin</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex gap-2">
                {u.role !== 'admin' && (
                  <form action={setRole.bind(null, u.id, 'admin')}>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      Tornar Admin
                    </Button>
                  </form>
                )}
                <form action={toggleApproval.bind(null, u.id, false)}>
                  <Button size="sm" variant="outline" className="text-xs h-8 text-red-600 border-red-200">
                    Revogar
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

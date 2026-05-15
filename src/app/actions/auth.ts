'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email ou senha incorretos.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.is_approved) {
    redirect('/aguardando-aprovacao')
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const display_name = formData.get('display_name') as string

  if (!display_name || display_name.trim().length < 2) {
    return { error: 'Nome deve ter pelo menos 2 caracteres.' }
  }
  if (!password || password.length < 8) {
    return { error: 'Senha deve ter pelo menos 8 caracteres.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: display_name.trim() },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email já está cadastrado.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  redirect('/aguardando-aprovacao')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function sendPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  // Sempre retorna sucesso por segurança (não revela se o email existe)
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: true }

  redirect('/dashboard')
}

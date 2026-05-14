import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default function AguardandoAprovacaoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro recebido!</h1>
        <p className="text-gray-600 mb-6">
          Seu cadastro está aguardando aprovação do administrador do bolão.
          Você receberá acesso em breve.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Se demorar muito, entre em contato com o organizador da família.
        </p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            Sair
          </Button>
        </form>
      </div>
    </div>
  )
}

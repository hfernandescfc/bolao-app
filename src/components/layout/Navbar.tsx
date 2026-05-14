import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function Navbar({ displayName }: { displayName: string }) {
  return (
    <header className="sticky top-0 z-40 bg-green-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="font-bold text-sm">Bolão dos Bezerra COPA 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-200 hidden sm:block">{displayName}</span>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-green-200 hover:text-white hover:bg-green-700 h-8 text-xs"
            >
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

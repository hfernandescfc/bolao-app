import Link from 'next/link'
import { BottomNav } from '@/components/layout/DemoBottomNav'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Banner de aviso */}
      <div className="bg-amber-500 text-amber-950 text-center py-1.5 px-4 text-xs font-medium">
        🎮 Modo Demo — dados fictícios, salvo em localStorage.{' '}
        <Link href="/login" className="underline font-bold">Entrar de verdade →</Link>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-green-800 text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-bold text-sm">Bolão dos Bezerra COPA 2026</span>
          </div>
          <span className="text-sm text-green-200">João (demo)</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full pb-20 px-4 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}

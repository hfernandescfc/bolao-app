import { MOCK_MATCHES } from '@/lib/mock/data'
import { DemoMatchList } from '@/components/matches/DemoMatchList'

export default function DemoMatchesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Palpites — Partidas</h1>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Palpites salvos no navegador (demo). Digite os placares e eles são salvos automaticamente.
      </p>
      <DemoMatchList matches={MOCK_MATCHES} />
    </div>
  )
}

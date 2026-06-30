'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShieldCheck } from 'lucide-react'

interface MatchOption {
  id: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  score_override: boolean
  scheduled_at: string
}

interface Props {
  matches: MatchOption[]
}

export function OverrideScoreForm({ matches }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; reconMatch?: number; error?: string } | null>(null)

  const selected = matches.find((m) => m.id === selectedId)

  function handleSelect(id: number) {
    setSelectedId(id)
    setResult(null)
    const m = matches.find((m) => m.id === id)
    if (m) {
      setHomeScore(m.home_score?.toString() ?? '')
      setAwayScore(m.away_score?.toString() ?? '')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || homeScore === '' || awayScore === '') return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/override-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: selectedId,
          home_score: Number(homeScore),
          away_score: Number(awayScore),
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Partidas encerradas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelect(m.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                selectedId === m.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="font-medium">{m.home_team} × {m.away_team}</span>
              <span className="ml-2 text-gray-500">
                {m.home_score ?? '?'}-{m.away_score ?? '?'}
              </span>
              {m.score_override && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  <ShieldCheck size={10} /> corrigido
                </span>
              )}
              <span className="ml-2 text-[11px] text-gray-400">
                {new Date(m.scheduled_at).toLocaleDateString('pt-BR')}
              </span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nenhuma partida encerrada.</p>
          )}
        </div>

        {selected && (
          <form onSubmit={handleSubmit} className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Placar correto para <span className="text-green-700">{selected.home_team} × {selected.away_team}</span>:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{selected.home_team}</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <span className="text-gray-400 font-bold mt-5">×</span>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{selected.away_team}</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 size={14} className="animate-spin mr-1" />}
              Salvar e recalcular pontos
            </Button>
          </form>
        )}

        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {result.error
              ? `Erro: ${result.error}`
              : `Placar corrigido. ${result.reconMatch ?? 0} palpite(s) recalculado(s).`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

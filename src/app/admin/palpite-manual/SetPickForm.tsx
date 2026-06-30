'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface UserOption {
  id: string
  display_name: string
  email: string
}

interface MatchOption {
  id: number
  status: string
  scheduled_at: string
  home_score: number | null
  away_score: number | null
  home_team: string
  away_team: string
}

interface Props {
  users: UserOption[]
  matches: MatchOption[]
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  LIVE: 'Ao vivo',
  PAUSED: 'Intervalo',
  FINISHED: 'Encerrada',
  POSTPONED: 'Adiada',
}

export function SetPickForm({ users, matches }: Props) {
  const [userId, setUserId] = useState('')
  const [matchId, setMatchId] = useState<number | ''>('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; points_earned?: number | null; error?: string } | null>(null)

  const selectedMatch = matches.find((m) => m.id === matchId)
  const selectedUser = users.find((u) => u.id === userId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !matchId || homeScore === '' || awayScore === '') return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/set-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          match_id: matchId,
          home_score: Number(homeScore),
          away_score: Number(awayScore),
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.ok) {
        setHomeScore('')
        setAwayScore('')
      }
    } catch {
      setResult({ error: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Inserir palpite</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Usuário */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Participante</label>
            <select
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setResult(null) }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              required
            >
              <option value="">Selecione o participante...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} — {u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Partida */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Partida</label>
            <select
              value={matchId}
              onChange={(e) => { setMatchId(Number(e.target.value) || ''); setResult(null) }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              required
            >
              <option value="">Selecione a partida...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.home_team} × {m.away_team}
                  {' '}({STATUS_LABEL[m.status] ?? m.status})
                  {' '}— {new Date(m.scheduled_at).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          {/* Placar do palpite */}
          {selectedMatch && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-xs text-gray-500 text-center">
                Palpite de <span className="font-semibold text-gray-700">{selectedUser?.display_name ?? '...'}</span> para{' '}
                <span className="font-semibold text-gray-700">{selectedMatch.home_team} × {selectedMatch.away_team}</span>
              </p>
              {selectedMatch.status === 'FINISHED' && (
                <p className="text-xs text-center text-amber-700 bg-amber-50 rounded px-2 py-1">
                  Jogo já encerrado ({selectedMatch.home_score}-{selectedMatch.away_score}). Os pontos serão calculados automaticamente.
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1 text-center">{selectedMatch.home_team}</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    required
                  />
                </div>
                <span className="text-gray-400 font-bold mt-5">×</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1 text-center">{selectedMatch.away_team}</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !userId || !matchId} className="w-full">
            {loading && <Loader2 size={14} className="animate-spin mr-1" />}
            Salvar palpite
          </Button>
        </form>

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {result.error
              ? `Erro: ${result.error}`
              : result.points_earned !== null && result.points_earned !== undefined
                ? `Palpite salvo. ${result.points_earned} ponto(s) atribuído(s).`
                : 'Palpite salvo. Pontos serão calculados ao fim do jogo.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

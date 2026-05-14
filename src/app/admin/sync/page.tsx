'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'

interface SyncResult {
  updated?: number
  error?: string
}

export default function AdminSyncPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  async function handleSync() {
    setIsLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/sync-matches', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Erro de conexão' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCalculate() {
    setIsLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/calculate-scores', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Erro de conexão' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Sincronização com API</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">football-data.org</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-600">
            Busca placares atualizados da API e recalcula as pontuações automaticamente.
            O cron roda a cada 5 min durante os jogos (11-27 de junho).
          </p>
          <div className="flex gap-3">
            <Button onClick={handleSync} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
              Sincronizar agora
            </Button>
            <Button onClick={handleCalculate} disabled={isLoading} variant="outline" size="sm">
              Recalcular pontos
            </Button>
          </div>
          {result && (
            <div className={`p-3 rounded-lg text-sm ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {result.error ? `Erro: ${result.error}` : `✓ ${result.updated ?? 0} partida(s) atualizada(s)`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cron automático</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600 mb-2">
            Configure no <code className="bg-gray-100 px-1 rounded">vercel.json</code> na raiz do projeto.
            O cron está agendado para a fase de grupos (11-27 de junho).
          </p>
          <pre className="text-[10px] bg-gray-50 p-3 rounded-lg overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 10-23 11-27 6 *"
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

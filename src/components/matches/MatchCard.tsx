'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Match, MatchPick } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Flag } from '@/components/ui/flag'
import { Check, Clock, Loader2 } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/context'

interface MatchCardProps {
  match: Match
  pick: MatchPick | null
  isDeadlinePassed: boolean
  userId: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function MatchCard({ match, pick, isDeadlinePassed, userId }: MatchCardProps) {
  const [home, setHome] = useState(pick?.home_score?.toString() ?? '')
  const [away, setAway] = useState(pick?.away_score?.toString() ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Espelha o valor mais recente digitado e marca se há alteração ainda não
  // persistida. Permite dar "flush" do palpite no blur e no unmount sem
  // depender do estado capturado pelo closure do setTimeout.
  const latest = useRef({
    home: pick?.home_score?.toString() ?? '',
    away: pick?.away_score?.toString() ?? '',
    dirty: false,
  })
  const supabase = createClient()
  const t = useT()
  const { locale } = useLocale()

  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED'
  const disabled = isDeadlinePassed || isFinished

  const savePick = useCallback(
    async (h: string, a: string) => {
      const hNum = parseInt(h)
      const aNum = parseInt(a)
      if (isNaN(hNum) || isNaN(aNum) || hNum < 0 || aNum < 0) return

      setSaveState('saving')
      const { error } = await supabase.from('match_picks').upsert(
        {
          user_id: userId,
          match_id: match.id,
          home_score: hNum,
          away_score: aNum,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id' }
      )
      if (error) {
        // Mantém "dirty" para que um próximo flush (blur/unmount) tente de novo
        // e não se perca o palpite por uma falha momentânea de rede.
        latest.current.dirty = true
        setSaveState('error')
      } else {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      }
    },
    [match.id, userId, supabase]
  )

  // Persiste imediatamente o que estiver pendente, cancelando o debounce.
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!latest.current.dirty) return
    latest.current.dirty = false
    savePick(latest.current.home, latest.current.away)
  }, [savePick])

  function handleChange(value: string, side: 'home' | 'away') {
    if (disabled) return
    const clean = value.replace(/\D/g, '').slice(0, 2)
    if (side === 'home') setHome(clean)
    else setAway(clean)
    latest.current[side] = clean
    latest.current.dirty = true

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 800)
  }

  // Ao desmontar (troca de filtro/aba), grava o pendente em vez de descartá-lo.
  useEffect(() => () => { flush() }, [flush])

  const points = pick?.points_earned
  const showPoints = isFinished && points !== null && points !== undefined

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isLive ? 'border-yellow-400' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
          {t.matches.group} {match.group_id} · {t.matches.round} {match.matchday}
        </span>
        <div className="flex items-center gap-2">
          {isLive && <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">{t.matches.live}</Badge>}
          {isFinished && (
            <span className="text-[10px] text-gray-400">
              {match.home_score} x {match.away_score}
            </span>
          )}
          {showPoints && (
            <Badge
              className={`text-[10px] py-0 ${
                points === 3 ? 'bg-green-600' : points === 1 ? 'bg-yellow-500' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {points} pt{points !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="font-semibold text-sm text-gray-800 leading-tight truncate">
            {match.home_team?.name}
          </span>
          <Flag code={match.home_team?.code} size={22} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            value={home}
            onChange={(e) => handleChange(e.target.value, 'home')}
            onBlur={flush}
            disabled={disabled}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-bold p-1 disabled:opacity-50"
            inputMode="numeric"
          />
          <span className="text-gray-400 font-bold">x</span>
          <Input
            value={away}
            onChange={(e) => handleChange(e.target.value, 'away')}
            onBlur={flush}
            disabled={disabled}
            placeholder="0"
            className="w-12 h-10 text-center text-lg font-bold p-1 disabled:opacity-50"
            inputMode="numeric"
          />
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Flag code={match.away_team?.code} size={22} />
          <span className="font-semibold text-sm text-gray-800 leading-tight truncate">
            {match.away_team?.name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock size={10} />
          {formatDate(match.scheduled_at, locale)}
        </span>
        <span className="text-[10px]">
          {saveState === 'saving' && (
            <span className="text-gray-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> {t.matches.saving}
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-green-600 flex items-center gap-1">
              <Check size={10} /> {t.matches.saved}
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-red-500">{t.matches.saveError}</span>
          )}
        </span>
      </div>
    </div>
  )
}

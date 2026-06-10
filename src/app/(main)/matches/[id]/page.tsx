import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Lock, Clock } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calculateMatchPoints } from '@/lib/scoring/calculator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/ui/flag'
import { Match, PICKS_DEADLINE } from '@/types'
import { getT, getLocale } from '@/lib/i18n/server'

interface PickRow {
  user_id: string
  home_score: number
  away_score: number
  points_earned: number | null
  profile: { display_name: string }
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function MatchPicksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const matchId = parseInt(id)
  if (isNaN(matchId)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [t, locale] = await Promise.all([getT(), getLocale()])
  const td = t.matchDetail

  // Mesma trava de tempo da tela de palpites por participante: antes do início
  // da Copa ninguém vê os palpites alheios (o admin pode, para conferência).
  const deadlinePassed = new Date() >= PICKS_DEADLINE
  if (!deadlinePassed) {
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') {
      return (
        <div className="space-y-4">
          <BackLink label={td.back} />
          <Card>
            <CardContent className="py-8 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 max-w-xs">{td.locked}</p>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  // Leitura agregada (palpites de todos + nomes): service role, ignorando a RLS.
  const admin = createAdminClient()
  const [{ data: matchRaw }, { data: picksRaw }] = await Promise.all([
    admin
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .eq('id', matchId)
      .single(),
    admin
      .from('match_picks')
      .select('user_id, home_score, away_score, points_earned, profile:profiles!inner(display_name, is_approved)')
      .eq('match_id', matchId)
      .eq('profile.is_approved', true),
  ])

  if (!matchRaw) notFound()
  const match = matchRaw as Match
  const picks = (picksRaw ?? []) as unknown as PickRow[]

  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE' || match.status === 'PAUSED'
  const hasScore = match.home_score !== null && match.away_score !== null

  // Pontos por palpite: definitivos quando encerrado; provisórios ao vivo.
  const pointsFor = (p: PickRow): number | null => {
    if (isFinished && p.points_earned !== null) return p.points_earned
    if ((isFinished || isLive) && hasScore) {
      return calculateMatchPoints(
        { home_score: p.home_score, away_score: p.away_score },
        { home_score: match.home_score!, away_score: match.away_score! }
      )
    }
    return null
  }

  const rows = picks
    .map((p) => ({ ...p, pts: pointsFor(p) }))
    .sort((a, b) => {
      if (a.pts !== b.pts) return (b.pts ?? -1) - (a.pts ?? -1)
      return a.profile.display_name.localeCompare(b.profile.display_name, 'pt-BR')
    })

  const dist = { home: 0, draw: 0, away: 0 }
  for (const p of picks) {
    if (p.home_score > p.away_score) dist.home++
    else if (p.home_score < p.away_score) dist.away++
    else dist.draw++
  }

  // Resumo do jogo (definitivo quando encerrado, parcial ao vivo).
  const showSummary = (isFinished || isLive) && hasScore && rows.length > 0
  const summary = {
    exact: rows.filter((r) => r.pts === 7).length,
    result: rows.filter((r) => r.pts === 3).length,
    miss: rows.filter((r) => r.pts === 0).length,
  }

  return (
    <div className="space-y-4">
      <BackLink label={td.back} />

      {/* Cabeçalho do confronto */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              {t.matches.group} {match.group_id} · {t.matches.round} {match.matchday}
            </span>
            {isLive ? (
              <Badge variant="destructive" className="text-[10px] py-0 animate-pulse">{td.live}</Badge>
            ) : isFinished ? (
              <Badge className="text-[10px] py-0 bg-gray-500">{td.finished}</Badge>
            ) : (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock size={10} /> {formatDate(match.scheduled_at, locale)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
              <span className="font-semibold text-sm text-gray-800 truncate">{match.home_team?.name}</span>
              <Flag code={match.home_team?.code} size={24} />
            </div>
            <div className="shrink-0 w-[72px] text-center">
              {hasScore && (isLive || isFinished) ? (
                <span className={`text-2xl font-bold ${isLive ? 'text-red-600' : 'text-gray-900'}`}>
                  {match.home_score}<span className="text-gray-300 mx-1">x</span>{match.away_score}
                </span>
              ) : (
                <span className="text-xs text-gray-300 uppercase">x</span>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <Flag code={match.away_team?.code} size={24} />
              <span className="font-semibold text-sm text-gray-800 truncate">{match.away_team?.name}</span>
            </div>
          </div>
          {showSummary && (
            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-50">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                {t.matches.summaryExact}: <span className="font-semibold text-gray-700">{summary.exact}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                {t.matches.summaryResult}: <span className="font-semibold text-gray-700">{summary.result}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                {t.matches.summaryMiss}: <span className="font-semibold text-gray-700">{summary.miss}</span>
              </span>
            </div>
          )}
          {isLive && <p className="text-[10px] text-gray-400 text-center mt-2">{td.provisionalNote}</p>}
        </CardContent>
      </Card>

      {/* Distribuição 1 / X / 2 */}
      {picks.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <DistChip label={match.home_team?.code ?? '1'} count={dist.home} />
          <DistChip label={td.draw} count={dist.draw} />
          <DistChip label={match.away_team?.code ?? '2'} count={dist.away} />
          <span className="text-gray-400">· {picks.length} {td.picked}</span>
        </div>
      )}

      {/* Palpites */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-2">{td.title}</h2>
        {rows.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">{td.noPicks}</p>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white divide-y divide-gray-50">
            {rows.map((p) => {
              const isMe = p.user_id === user.id
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center justify-between px-4 py-2.5 ${isMe ? 'bg-green-50' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/participantes/${p.user_id}`}
                      className={`text-sm truncate hover:underline ${isMe ? 'font-semibold text-green-800' : 'text-green-700'}`}
                    >
                      {p.profile.display_name}
                    </Link>
                    {isMe && (
                      <Badge variant="outline" className="text-[10px] py-0 border-green-600 text-green-700 shrink-0">
                        {t.ranking.you}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-gray-800 tabular-nums">
                      {p.home_score} <span className="text-gray-300">x</span> {p.away_score}
                    </span>
                    {p.pts !== null && <PtsBadge pts={p.pts} provisional={isLive} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PtsBadge({ pts, provisional }: { pts: number; provisional: boolean }) {
  // Verde = acerto máximo (7), amarelo = parcial (3), cinza = zero.
  // Ao vivo, o badge fica vazado (outline) para sinalizar que é provisório.
  if (provisional) {
    const color =
      pts === 7 ? 'border-green-600 text-green-700' : pts === 3 ? 'border-yellow-500 text-yellow-600' : 'border-gray-300 text-gray-400'
    return <Badge variant="outline" className={`text-[10px] py-0 w-9 justify-center ${color}`}>+{pts}</Badge>
  }
  const color = pts === 7 ? 'bg-green-600' : pts === 3 ? 'bg-yellow-500' : 'bg-gray-300 text-gray-700'
  return <Badge className={`text-[10px] py-0 w-9 justify-center ${color}`}>{pts} pt{pts === 1 ? '' : 's'}</Badge>
}

function DistChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
      {label}: <span className="font-semibold">{count}</span>
    </span>
  )
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/matches" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
      <ArrowLeft size={14} /> {label}
    </Link>
  )
}

-- =============================================================
-- Fase Eliminatória — Copa 2026
--
-- 1. Adiciona coluna 'round' em matches ('GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | '3RD' | 'FINAL')
-- 2. Remove restrição matchday IN (1,2,3) e torna matchday nullable
-- 3. Torna group_id nullable (partidas eliminatórias não pertencem a um grupo)
-- 4. Substitui a trava global (picks_open) por trava por partida:
--    palpite permitido até 10 min antes do kickoff
-- 5. Bloqueia permanentemente novos palpites de grupos (fase encerrada)
-- 6. Atualiza recalculate_leaderboard() para contar apenas eliminatórias
--    com nova pontuação (exato=10, resultado=5–9)
-- 7. Zera o leaderboard (pontuação da fase de grupos não conta)
-- =============================================================

-- -------- 1. Coluna round em matches --------
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round TEXT NOT NULL DEFAULT 'GROUP';

-- -------- 2. matchday: remover NOT NULL e o CHECK --------
ALTER TABLE public.matches ALTER COLUMN matchday DROP NOT NULL;
-- Nome gerado automaticamente pelo Postgres na migration 001
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_matchday_check;

-- -------- 3. group_id: remover NOT NULL --------
ALTER TABLE public.matches ALTER COLUMN group_id DROP NOT NULL;

-- -------- 4. RLS match_picks: prazo por partida --------
-- Remover PRIMEIRO todas as policies que dependem de picks_open() — nas duas tabelas
DROP POLICY IF EXISTS "Inserir palpites de partidas no prazo" ON public.match_picks;
DROP POLICY IF EXISTS "Atualizar palpites de partidas no prazo" ON public.match_picks;
DROP POLICY IF EXISTS "Inserir palpites de grupos no prazo"    ON public.group_picks;
DROP POLICY IF EXISTS "Atualizar palpites de grupos no prazo"  ON public.group_picks;
-- Agora é seguro remover a função
DROP FUNCTION IF EXISTS public.picks_open();

CREATE POLICY "Inserir palpites de partidas no prazo" ON public.match_picks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'SCHEDULED'
        AND m.home_team_id IS NOT NULL
        AND m.away_team_id IS NOT NULL
        AND NOW() < m.scheduled_at - INTERVAL '10 minutes'
    )
  );

CREATE POLICY "Atualizar palpites de partidas no prazo" ON public.match_picks
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'SCHEDULED'
        AND m.home_team_id IS NOT NULL
        AND m.away_team_id IS NOT NULL
        AND NOW() < m.scheduled_at - INTERVAL '10 minutes'
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'SCHEDULED'
        AND m.home_team_id IS NOT NULL
        AND m.away_team_id IS NOT NULL
        AND NOW() < m.scheduled_at - INTERVAL '10 minutes'
    )
  );

-- -------- 5. Bloquear palpites de grupos permanentemente --------
-- (os DROPs já foram feitos na seção 4 acima)
CREATE POLICY "Inserir palpites de grupos bloqueados" ON public.group_picks
  FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Atualizar palpites de grupos bloqueados" ON public.group_picks
  FOR UPDATE USING (FALSE) WITH CHECK (FALSE);

-- -------- 6. Atualizar recalculate_leaderboard --------
-- Conta apenas picks de partidas eliminatórias (round != 'GROUP').
-- Limiar exato = 10 pts; resultado certo = 5 ou 7 pts (intervalo 5–9).
CREATE OR REPLACE FUNCTION public.recalculate_leaderboard()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.leaderboard (
    user_id, match_points, group_points, total_points,
    exact_score_count, correct_result_count, last_updated
  )
  SELECT
    p.id,
    COALESCE(m.match_points, 0),
    0,
    COALESCE(m.match_points, 0),
    COALESCE(m.exact_count, 0),
    COALESCE(m.correct_count, 0),
    NOW()
  FROM public.profiles p
  LEFT JOIN (
    SELECT
      mp.user_id,
      SUM(mp.points_earned)                                      AS match_points,
      COUNT(*) FILTER (WHERE mp.points_earned = 10)              AS exact_count,
      COUNT(*) FILTER (WHERE mp.points_earned >= 5
                         AND mp.points_earned < 10)              AS correct_count
    FROM public.match_picks mp
    JOIN public.matches mt ON mt.id = mp.match_id
    WHERE mt.round != 'GROUP'
      AND mp.points_earned IS NOT NULL
    GROUP BY mp.user_id
  ) m ON m.user_id = p.id
  ON CONFLICT (user_id) DO UPDATE SET
    match_points         = EXCLUDED.match_points,
    group_points         = EXCLUDED.group_points,
    total_points         = EXCLUDED.total_points,
    exact_score_count    = EXCLUDED.exact_score_count,
    correct_result_count = EXCLUDED.correct_result_count,
    last_updated         = EXCLUDED.last_updated;
END;
$$;

-- -------- 7. Zerar leaderboard --------
UPDATE public.leaderboard
SET
  match_points         = 0,
  group_points         = 0,
  total_points         = 0,
  exact_score_count    = 0,
  correct_result_count = 0,
  last_updated         = NOW();

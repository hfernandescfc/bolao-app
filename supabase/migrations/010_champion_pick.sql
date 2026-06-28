-- =============================================================
-- Palpite de Campeão — Copa 2026 (fase eliminatória)
--
-- 1. Tabela champion_picks (um palpite de campeão por usuário)
-- 2. RLS: criar/editar até o prazo (início do 2º dia da R32: 2026-06-29 17:00 UTC)
-- 3. Coluna champion_points no leaderboard
-- 4. recalculate_leaderboard(): credita 10 pts a quem acertar o campeão
--    (vencedor da FINAL) e soma no total
--
-- Valor do palpite (10 pts) = ~10% da pontuação média do vencedor do bolão,
-- estimada por simulação de Monte Carlo (scripts/champion-montecarlo.ts).
-- =============================================================

-- -------- 1. Tabela champion_picks --------
CREATE TABLE IF NOT EXISTS public.champion_picks (
  user_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id       INTEGER NOT NULL REFERENCES public.teams(id),
  points_earned INTEGER,        -- NULL até a final ser resolvida; depois 10 ou 0
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.champion_picks ENABLE ROW LEVEL SECURITY;

-- -------- 2. RLS: prazo de fechamento --------
-- Prazo: início do primeiro jogo do dia 29/06 (2º dia da R32).
DROP POLICY IF EXISTS "Ler proprio palpite de campeao"      ON public.champion_picks;
DROP POLICY IF EXISTS "Inserir palpite de campeao no prazo" ON public.champion_picks;
DROP POLICY IF EXISTS "Atualizar palpite de campeao no prazo" ON public.champion_picks;

CREATE POLICY "Ler proprio palpite de campeao" ON public.champion_picks
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Inserir palpite de campeao no prazo" ON public.champion_picks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < TIMESTAMPTZ '2026-06-29 17:00:00+00'
  );

CREATE POLICY "Atualizar palpite de campeao no prazo" ON public.champion_picks
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND NOW() < TIMESTAMPTZ '2026-06-29 17:00:00+00'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND NOW() < TIMESTAMPTZ '2026-06-29 17:00:00+00'
  );

-- -------- 3. Coluna champion_points no leaderboard --------
ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS champion_points INTEGER NOT NULL DEFAULT 0;

-- -------- 4. recalculate_leaderboard() com bônus de campeão --------
CREATE OR REPLACE FUNCTION public.recalculate_leaderboard()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  champ_team INTEGER;
BEGIN
  -- Campeão oficial: vencedor da FINAL encerrada, pelo placar do fim da
  -- prorrogação. Em decisão por pênaltis (empate no placar) o vencedor não é
  -- determinável aqui → fica NULL e o bônus só é creditado quando resolvido.
  SELECT CASE
           WHEN home_score > away_score THEN home_team_id
           WHEN away_score > home_score THEN away_team_id
           ELSE NULL
         END
    INTO champ_team
  FROM public.matches
  WHERE round = 'FINAL' AND status = 'FINISHED'
    AND home_score IS NOT NULL AND away_score IS NOT NULL
  ORDER BY scheduled_at DESC
  LIMIT 1;

  -- points_earned do palpite de campeão (para exibição em "Meus palpites")
  UPDATE public.champion_picks cp
  SET points_earned = CASE
        WHEN champ_team IS NULL          THEN NULL
        WHEN cp.team_id = champ_team      THEN 10
        ELSE 0
      END;

  INSERT INTO public.leaderboard (
    user_id, match_points, group_points, champion_points, total_points,
    exact_score_count, correct_result_count, last_updated
  )
  SELECT
    p.id,
    COALESCE(m.match_points, 0),
    0,
    CASE WHEN champ_team IS NOT NULL AND cp.team_id = champ_team THEN 10 ELSE 0 END,
    COALESCE(m.match_points, 0)
      + CASE WHEN champ_team IS NOT NULL AND cp.team_id = champ_team THEN 10 ELSE 0 END,
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
  LEFT JOIN public.champion_picks cp ON cp.user_id = p.id
  ON CONFLICT (user_id) DO UPDATE SET
    match_points         = EXCLUDED.match_points,
    group_points         = EXCLUDED.group_points,
    champion_points      = EXCLUDED.champion_points,
    total_points         = EXCLUDED.total_points,
    exact_score_count    = EXCLUDED.exact_score_count,
    correct_result_count = EXCLUDED.correct_result_count,
    last_updated         = EXCLUDED.last_updated;
END;
$$;

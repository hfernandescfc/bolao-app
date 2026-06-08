-- =============================================================
-- Nova tabela de pontuação (regulamento 2026-06-08)
--
-- Partidas:
--   - placar exato   = 7 pontos  (antes 3)
--   - resultado certo = 3 pontos (antes 1)
--   - erro           = 0 pontos
--
-- Classificação de grupo (agora a ORDEM importa):
--   - 1º e 2º na ordem certa     = 10 pontos
--   - os dois, posições trocadas =  6 pontos
--   - apenas um classificado     =  2 pontos
--   - nenhum                     =  0 pontos
--
-- A lógica de cálculo dos pontos vive no app (src/lib/scoring) e grava
-- match_picks.points_earned / group_picks.points_earned. Esta migration
-- só precisa corrigir recalculate_leaderboard(), que contava placares
-- exatos por "points_earned = 3" e resultados por "points_earned = 1" —
-- valores que agora mudaram para 7 e 3.
--
-- IMPORTANTE: depois de aplicar esta migration, é preciso recalcular
-- todos os palpites já pontuados (rodar a rotina de scoring do app, que
-- é idempotente) e em seguida chamar recalculate_leaderboard().
-- =============================================================

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
    COALESCE(g.group_points, 0),
    COALESCE(m.match_points, 0) + COALESCE(g.group_points, 0),
    COALESCE(m.exact_count, 0),
    COALESCE(m.correct_count, 0),
    NOW()
  FROM public.profiles p
  LEFT JOIN (
    SELECT
      user_id,
      SUM(points_earned)                              AS match_points,
      COUNT(*) FILTER (WHERE points_earned = 7)       AS exact_count,
      COUNT(*) FILTER (WHERE points_earned = 3)       AS correct_count
    FROM public.match_picks
    GROUP BY user_id
  ) m ON m.user_id = p.id
  LEFT JOIN (
    SELECT user_id, SUM(points_earned) AS group_points
    FROM public.group_picks
    GROUP BY user_id
  ) g ON g.user_id = p.id
  ON CONFLICT (user_id) DO UPDATE SET
    match_points         = EXCLUDED.match_points,
    group_points         = EXCLUDED.group_points,
    total_points         = EXCLUDED.total_points,
    exact_score_count    = EXCLUDED.exact_score_count,
    correct_result_count = EXCLUDED.correct_result_count,
    last_updated         = EXCLUDED.last_updated;
END;
$$;

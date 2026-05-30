-- =============================================================
-- Corrige o cálculo do leaderboard (bug de fan-out)
--
-- A versão original (migration 001) fazia:
--   FROM profiles p
--   LEFT JOIN match_picks mp ON ...
--   LEFT JOIN group_picks gp ON ...
--   ... SUM(mp.points_earned), SUM(gp.points_earned)
--
-- Com dois LEFT JOINs "irmãos", o Postgres produz o PRODUTO CARTESIANO
-- das linhas: um usuário com 72 palpites de partida e 12 de grupo gera
-- 72 × 12 = 864 linhas. Resultado:
--   - SUM(match_points) fica multiplicado por 12 (nº de group_picks)
--   - SUM(group_points) fica multiplicado por 72 (nº de match_picks)
--   - exact_score_count / correct_result_count idem
-- Ou seja, o ranking inteiro ficaria errado assim que houvesse palpites
-- dos dois tipos.
--
-- A correção pré-agrega cada tabela em subqueries separadas antes do JOIN,
-- eliminando o fan-out.
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
      COUNT(*) FILTER (WHERE points_earned = 3)       AS exact_count,
      COUNT(*) FILTER (WHERE points_earned = 1)       AS correct_count
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

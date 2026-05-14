-- =============================================================
-- Bolão Copa do Mundo 2026 — Schema inicial
-- Execute no SQL Editor do Supabase: supabase.com > SQL Editor
-- =============================================================

-- Grupos (A a L)
CREATE TABLE public.groups (
  id   TEXT PRIMARY KEY,  -- 'A', 'B', ..., 'L'
  name TEXT NOT NULL      -- 'Grupo A', etc.
);

-- Seleções (48 times)
CREATE TABLE public.teams (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  code     TEXT NOT NULL UNIQUE,  -- 'BRA', 'MEX', etc.
  flag_emoji TEXT,                -- emoji da bandeira, opcional
  group_id TEXT NOT NULL REFERENCES public.groups(id)
);

-- Partidas (72 jogos da fase de grupos)
CREATE TABLE public.matches (
  id           SERIAL PRIMARY KEY,
  external_id  INTEGER UNIQUE,    -- ID da football-data.org (preenchido pelo sync)
  group_id     TEXT NOT NULL REFERENCES public.groups(id),
  matchday     INTEGER NOT NULL CHECK (matchday IN (1, 2, 3)),
  home_team_id INTEGER NOT NULL REFERENCES public.teams(id),
  away_team_id INTEGER NOT NULL REFERENCES public.teams(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'SCHEDULED'
               CHECK (status IN ('SCHEDULED', 'LIVE', 'PAUSED', 'FINISHED', 'POSTPONED')),
  home_score   INTEGER,
  away_score   INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de usuário (estende auth.users do Supabase)
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'participant'
               CHECK (role IN ('participant', 'admin')),
  is_approved  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Palpites de partidas
CREATE TABLE public.match_picks (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id      INTEGER NOT NULL REFERENCES public.matches(id),
  home_score    INTEGER NOT NULL CHECK (home_score >= 0),
  away_score    INTEGER NOT NULL CHECK (away_score >= 0),
  points_earned INTEGER,          -- NULL até o jogo terminar; depois 0, 1 ou 3
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Palpites de classificados por grupo
CREATE TABLE public.group_picks (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id      TEXT NOT NULL REFERENCES public.groups(id),
  first_place   INTEGER NOT NULL REFERENCES public.teams(id),
  second_place  INTEGER NOT NULL REFERENCES public.teams(id),
  points_earned INTEGER,          -- NULL até grupo encerrar; depois 0, 1 ou 2
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id),
  CHECK (first_place <> second_place)
);

-- Leaderboard (tabela desnormalizada, atualizada pelo cron)
CREATE TABLE public.leaderboard (
  user_id              UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_points         INTEGER NOT NULL DEFAULT 0,
  group_points         INTEGER NOT NULL DEFAULT 0,
  total_points         INTEGER NOT NULL DEFAULT 0,
  exact_score_count    INTEGER NOT NULL DEFAULT 0,
  correct_result_count INTEGER NOT NULL DEFAULT 0,
  last_updated         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de sincronizações com a API
CREATE TABLE public.sync_log (
  id               SERIAL PRIMARY KEY,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matches_updated  INTEGER NOT NULL DEFAULT 0,
  triggered_by     TEXT NOT NULL DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'admin'))
);

-- =============================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'participant',
    false
  );
  INSERT INTO public.leaderboard (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- FUNÇÃO: recalcular leaderboard
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
    COALESCE(SUM(mp.points_earned), 0),
    COALESCE(SUM(gp.points_earned), 0),
    COALESCE(SUM(mp.points_earned), 0) + COALESCE(SUM(gp.points_earned), 0),
    COUNT(CASE WHEN mp.points_earned = 3 THEN 1 END),
    COUNT(CASE WHEN mp.points_earned = 1 THEN 1 END),
    NOW()
  FROM public.profiles p
  LEFT JOIN public.match_picks mp ON mp.user_id = p.id
  LEFT JOIN public.group_picks gp ON gp.user_id = p.id
  GROUP BY p.id
  ON CONFLICT (user_id) DO UPDATE SET
    match_points         = EXCLUDED.match_points,
    group_points         = EXCLUDED.group_points,
    total_points         = EXCLUDED.total_points,
    exact_score_count    = EXCLUDED.exact_score_count,
    correct_result_count = EXCLUDED.correct_result_count,
    last_updated         = EXCLUDED.last_updated;
END;
$$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_picks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_picks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log     ENABLE ROW LEVEL SECURITY;

-- Helpers para verificar role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); $$;

CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true); $$;

-- Profiles
CREATE POLICY "Próprio perfil ou admin" ON public.profiles
  FOR ALL USING (auth.uid() = id OR public.is_admin());

-- Times e Grupos — leitura para todos os autenticados
CREATE POLICY "Autenticados leem times" ON public.teams
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Autenticados leem grupos" ON public.groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin pode inserir/editar times e grupos (para seed via service role)
CREATE POLICY "Admin gere times" ON public.teams
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admin gere grupos" ON public.groups
  FOR ALL USING (public.is_admin());

-- Partidas — leitura para aprovados; escrita apenas admin
CREATE POLICY "Aprovados leem partidas" ON public.matches
  FOR SELECT USING (public.is_approved() OR public.is_admin());
CREATE POLICY "Admin gere partidas" ON public.matches
  FOR ALL USING (public.is_admin());

-- Palpites de partidas
CREATE POLICY "Próprios palpites de partidas" ON public.match_picks
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todos palpites de partidas" ON public.match_picks
  FOR SELECT USING (public.is_admin());

-- Palpites de grupos
CREATE POLICY "Próprios palpites de grupos" ON public.group_picks
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin vê todos palpites de grupos" ON public.group_picks
  FOR SELECT USING (public.is_admin());

-- Leaderboard — todos os aprovados podem ler
CREATE POLICY "Aprovados leem ranking" ON public.leaderboard
  FOR SELECT USING (public.is_approved() OR public.is_admin());
CREATE POLICY "Sistema atualiza ranking" ON public.leaderboard
  FOR ALL USING (public.is_admin());

-- Sync log — apenas admin
CREATE POLICY "Admin vê sync log" ON public.sync_log
  FOR ALL USING (public.is_admin());

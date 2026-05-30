-- =============================================================
-- Trava de prazo dos palpites no banco (defesa server-side)
--
-- Até aqui o prazo (PICKS_DEADLINE) era verificado apenas no front-end
-- (inputs desabilitados). A RLS permitia que qualquer usuário autenticado
-- gravasse/alterasse os próprios palpites a QUALQUER momento — inclusive
-- depois do jogo começar — bastando chamar a API direto.
--
-- Esta migration fecha esse buraco: a escrita de palpites passa a ser
-- recusada pelo próprio Postgres após o prazo. Leitura continua liberada.
--
-- IMPORTANTE: a data abaixo precisa ser idêntica a PICKS_DEADLINE em
-- src/types/index.ts. O cron/admin usam a service role, que ignora RLS,
-- então continuam podendo gravar pontos normalmente.
-- =============================================================

CREATE OR REPLACE FUNCTION public.picks_open()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$ SELECT NOW() < TIMESTAMPTZ '2026-06-11 16:00:00+00'; $$;

-- ---------- match_picks ----------
DROP POLICY IF EXISTS "Próprios palpites de partidas" ON public.match_picks;
DROP POLICY IF EXISTS "Ler próprios palpites de partidas" ON public.match_picks;
DROP POLICY IF EXISTS "Inserir palpites de partidas no prazo" ON public.match_picks;
DROP POLICY IF EXISTS "Atualizar palpites de partidas no prazo" ON public.match_picks;

CREATE POLICY "Ler próprios palpites de partidas" ON public.match_picks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Inserir palpites de partidas no prazo" ON public.match_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.picks_open());

CREATE POLICY "Atualizar palpites de partidas no prazo" ON public.match_picks
  FOR UPDATE USING (auth.uid() = user_id AND public.picks_open())
             WITH CHECK (auth.uid() = user_id AND public.picks_open());

-- ---------- group_picks ----------
DROP POLICY IF EXISTS "Próprios palpites de grupos" ON public.group_picks;
DROP POLICY IF EXISTS "Ler próprios palpites de grupos" ON public.group_picks;
DROP POLICY IF EXISTS "Inserir palpites de grupos no prazo" ON public.group_picks;
DROP POLICY IF EXISTS "Atualizar palpites de grupos no prazo" ON public.group_picks;

CREATE POLICY "Ler próprios palpites de grupos" ON public.group_picks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Inserir palpites de grupos no prazo" ON public.group_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.picks_open());

CREATE POLICY "Atualizar palpites de grupos no prazo" ON public.group_picks
  FOR UPDATE USING (auth.uid() = user_id AND public.picks_open())
             WITH CHECK (auth.uid() = user_id AND public.picks_open());

-- Observação: não há policy de DELETE para participantes — palpites não
-- podem ser apagados pelo app, apenas sobrescritos antes do prazo.

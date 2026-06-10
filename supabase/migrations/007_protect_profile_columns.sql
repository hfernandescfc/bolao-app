-- =============================================================
-- 007: impede escalada de privilégio via colunas de profiles
--
-- A policy "Próprio perfil ou admin" (001) é FOR ALL com
-- USING (auth.uid() = id OR is_admin()). RLS é por LINHA, não por
-- coluna: qualquer usuário autenticado podia dar PATCH na própria
-- linha — inclusive em `role` e `is_approved` — direto na API REST
-- do Supabase (a anon key é pública no bundle) e virar admin
-- aprovado sem passar pelo app.
--
-- Grants por coluna não resolvem: admin e participante usam o mesmo
-- role Postgres (`authenticated`), então a distinção precisa ser por
-- usuário — daí o trigger.
--
-- Regra: requisições com JWT `authenticated` de quem NÃO é admin não
-- podem definir/alterar `role` nem `is_approved`. Ficam livres:
--   - admins (is_admin());
--   - service role (auth.role() = 'service_role'), usada por
--     createAdminClient e pelo cron;
--   - conexões diretas ao banco (auth.role() IS NULL): migrations,
--     seed e o trigger handle_new_user via signup (SECURITY DEFINER
--     roda no contexto do signup, que insere valores padrão seguros).
--
-- Cobre INSERT também: sem isso, um participante poderia apagar a
-- própria linha (a policy FOR ALL permite DELETE) e reinseri-la com
-- role='admin'.
--
-- Idempotente: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- =============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só restringe usuários comuns autenticados via API (PostgREST).
  IF auth.role() IS DISTINCT FROM 'authenticated' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role <> 'participant' OR NEW.is_approved THEN
      RAISE EXCEPTION 'Não é permitido definir role/is_approved';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'Não é permitido alterar role/is_approved';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;

CREATE TRIGGER protect_profile_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- =============================================================
-- 006: nome de exibição para cadastros via OAuth (Google, etc.)
-- =============================================================
-- O cadastro por e-mail manda `display_name` em raw_user_meta_data.
-- Já o Google manda `full_name` / `name` (e `avatar_url`). Sem isto,
-- usuários que entram por Google ficavam com o prefixo do e-mail como nome.
-- Mantém o restante do comportamento (role participant, is_approved false).

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
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(NEW.email, '@', 1)
    ),
    'participant',
    false
  );
  INSERT INTO public.leaderboard (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

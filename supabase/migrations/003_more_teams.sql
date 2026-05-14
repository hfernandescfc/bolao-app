-- =============================================================
-- Correção complementar de times: nomes em português para
-- seleções que ficaram fora do mapeamento inicial.
-- Execute no SQL Editor do Supabase.
-- =============================================================

UPDATE public.teams SET name = 'Haiti'           WHERE code IN ('HAI', 'HTI');
UPDATE public.teams SET name = 'Curaçao'         WHERE code IN ('CUW', 'CUR');
UPDATE public.teams SET name = 'Suécia'          WHERE code IN ('SWE');
UPDATE public.teams SET name = 'Cabo Verde'      WHERE code IN ('CPV', 'CAV');
UPDATE public.teams SET name = 'Uruguai'         WHERE code IN ('URU', 'URY');
UPDATE public.teams SET name = 'Noruega'         WHERE code IN ('NOR');
UPDATE public.teams SET name = 'Argélia'         WHERE code IN ('ALG', 'DZA');
UPDATE public.teams SET name = 'Áustria'         WHERE code IN ('AUT');
UPDATE public.teams SET name = 'RD Congo'        WHERE code IN ('COD');
UPDATE public.teams SET name = 'Congo'           WHERE code IN ('COG', 'CGO');
UPDATE public.teams SET name = 'Dinamarca'       WHERE code IN ('DEN', 'DNK');
UPDATE public.teams SET name = 'Ucrânia'         WHERE code IN ('UKR');
UPDATE public.teams SET name = 'Irlanda'         WHERE code IN ('IRL');
UPDATE public.teams SET name = 'País de Gales'   WHERE code IN ('WAL');
UPDATE public.teams SET name = 'Irlanda do Norte' WHERE code IN ('NIR');

-- Conferir se ainda há time sem nome em português
SELECT id, code, name FROM public.teams ORDER BY group_id, id;

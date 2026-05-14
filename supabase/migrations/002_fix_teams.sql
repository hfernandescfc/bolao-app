-- =============================================================
-- Correção dos times: nomes em português + emojis de bandeira
-- Execute no SQL Editor do Supabase após o seed inicial
-- =============================================================

UPDATE public.teams SET name = 'México',             flag_emoji = '🇲🇽' WHERE code IN ('MEX');
UPDATE public.teams SET name = 'África do Sul',      flag_emoji = '🇿🇦' WHERE code IN ('RSA', 'ZAF');
UPDATE public.teams SET name = 'Coreia do Sul',      flag_emoji = '🇰🇷' WHERE code IN ('KOR', 'SKR');
UPDATE public.teams SET name = 'Rep. Tcheca',        flag_emoji = '🇨🇿' WHERE code IN ('CZE', 'CZK');
UPDATE public.teams SET name = 'Canadá',             flag_emoji = '🇨🇦' WHERE code IN ('CAN');
UPDATE public.teams SET name = 'Suíça',              flag_emoji = '🇨🇭' WHERE code IN ('SUI', 'CHE');
UPDATE public.teams SET name = 'Catar',              flag_emoji = '🇶🇦' WHERE code IN ('QAT');
UPDATE public.teams SET name = 'Bósnia-Herz.',       flag_emoji = '🇧🇦' WHERE code IN ('BIH');
UPDATE public.teams SET name = 'Argentina',          flag_emoji = '🇦🇷' WHERE code IN ('ARG');
UPDATE public.teams SET name = 'Chile',              flag_emoji = '🇨🇱' WHERE code IN ('CHI', 'CHL');
UPDATE public.teams SET name = 'Sérvia',             flag_emoji = '🇷🇸' WHERE code IN ('SRB');
UPDATE public.teams SET name = 'Arábia Saudita',     flag_emoji = '🇸🇦' WHERE code IN ('SAU', 'KSA');
UPDATE public.teams SET name = 'Estados Unidos',     flag_emoji = '🇺🇸' WHERE code IN ('USA');
UPDATE public.teams SET name = 'Paraguai',           flag_emoji = '🇵🇾' WHERE code IN ('PAR', 'PRY');
UPDATE public.teams SET name = 'Austrália',          flag_emoji = '🇦🇺' WHERE code IN ('AUS');
UPDATE public.teams SET name = 'Turquia',            flag_emoji = '🇹🇷' WHERE code IN ('TUR', 'TKY');
UPDATE public.teams SET name = 'França',             flag_emoji = '🇫🇷' WHERE code IN ('FRA');
UPDATE public.teams SET name = 'Bélgica',            flag_emoji = '🇧🇪' WHERE code IN ('BEL');
UPDATE public.teams SET name = 'Japão',              flag_emoji = '🇯🇵' WHERE code IN ('JPN');
UPDATE public.teams SET name = 'Senegal',            flag_emoji = '🇸🇳' WHERE code IN ('SEN');
UPDATE public.teams SET name = 'Espanha',            flag_emoji = '🇪🇸' WHERE code IN ('ESP');
UPDATE public.teams SET name = 'Colômbia',           flag_emoji = '🇨🇴' WHERE code IN ('COL');
UPDATE public.teams SET name = 'Marrocos',           flag_emoji = '🇲🇦' WHERE code IN ('MAR');
UPDATE public.teams SET name = 'Hungria',            flag_emoji = '🇭🇺' WHERE code IN ('HUN');
UPDATE public.teams SET name = 'Brasil',             flag_emoji = '🇧🇷' WHERE code IN ('BRA');
UPDATE public.teams SET name = 'Equador',            flag_emoji = '🇪🇨' WHERE code IN ('ECU');
UPDATE public.teams SET name = 'Nigéria',            flag_emoji = '🇳🇬' WHERE code IN ('NGA');
UPDATE public.teams SET name = 'Polônia',            flag_emoji = '🇵🇱' WHERE code IN ('POL');
UPDATE public.teams SET name = 'Portugal',           flag_emoji = '🇵🇹' WHERE code IN ('POR');
UPDATE public.teams SET name = 'Uruguai',            flag_emoji = '🇺🇾' WHERE code IN ('URU');
UPDATE public.teams SET name = 'Irã',                flag_emoji = '🇮🇷' WHERE code IN ('IRN', 'IRI');
UPDATE public.teams SET name = 'Costa do Marfim',    flag_emoji = '🇨🇮' WHERE code IN ('CIV', 'CID');
UPDATE public.teams SET name = 'Inglaterra',         flag_emoji = '🏴󠁧󠁢󠁥󠁮󠁧󠁿' WHERE code IN ('ENG');
UPDATE public.teams SET name = 'Holanda',            flag_emoji = '🇳🇱' WHERE code IN ('NED', 'NDL');
UPDATE public.teams SET name = 'Gana',               flag_emoji = '🇬🇭' WHERE code IN ('GHA');
UPDATE public.teams SET name = 'Eslováquia',         flag_emoji = '🇸🇰' WHERE code IN ('SVK');
UPDATE public.teams SET name = 'Alemanha',           flag_emoji = '🇩🇪' WHERE code IN ('GER', 'DEU');
UPDATE public.teams SET name = 'Peru',               flag_emoji = '🇵🇪' WHERE code IN ('PER');
UPDATE public.teams SET name = 'Indonésia',          flag_emoji = '🇮🇩' WHERE code IN ('IDN');
UPDATE public.teams SET name = 'Escócia',            flag_emoji = '🏴󠁧󠁢󠁳󠁣󠁴󠁿' WHERE code IN ('SCO');
UPDATE public.teams SET name = 'Itália',             flag_emoji = '🇮🇹' WHERE code IN ('ITA');
UPDATE public.teams SET name = 'Venezuela',          flag_emoji = '🇻🇪' WHERE code IN ('VEN');
UPDATE public.teams SET name = 'Egito',              flag_emoji = '🇪🇬' WHERE code IN ('EGY');
UPDATE public.teams SET name = 'Eslovênia',          flag_emoji = '🇸🇮' WHERE code IN ('SVN');
UPDATE public.teams SET name = 'Croácia',            flag_emoji = '🇭🇷' WHERE code IN ('CRO');
UPDATE public.teams SET name = 'Tunísia',            flag_emoji = '🇹🇳' WHERE code IN ('TUN');
UPDATE public.teams SET name = 'Jamaica',            flag_emoji = '🇯🇲' WHERE code IN ('JAM');
UPDATE public.teams SET name = 'Geórgia',            flag_emoji = '🇬🇪' WHERE code IN ('GEO');

-- Verificar resultado
SELECT id, code, name, flag_emoji FROM public.teams ORDER BY group_id, id;

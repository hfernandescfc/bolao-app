-- Permite que admins corrijam placares errados da API sem serem sobrescritos pelo sync
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score_override BOOLEAN NOT NULL DEFAULT FALSE;

-- Adicionar coluna used_unit na tabela packaging para consistência com ingredients
ALTER TABLE public.packaging 
ADD COLUMN IF NOT EXISTS used_unit TEXT;
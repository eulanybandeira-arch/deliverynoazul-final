
-- Adicionar coluna used_unit na tabela ingredients para persistir a unidade da quantidade utilizada
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS used_unit TEXT;

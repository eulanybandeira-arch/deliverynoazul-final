-- Adiciona flag de confirmação de dados legais
ALTER TABLE public.business_identity 
ADD COLUMN IF NOT EXISTS dados_confirmados boolean DEFAULT false;

-- Adiciona colunas para dados completos de identificação
ALTER TABLE public.business_identity 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'cnpj',
ADD COLUMN IF NOT EXISTS documento text,
ADD COLUMN IF NOT EXISTS razao_social text,
ADD COLUMN IF NOT EXISTS nome_completo text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS telefone text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS logradouro text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS estado text;

-- Função que bloqueia edição de dados legais após confirmação
CREATE OR REPLACE FUNCTION public.prevent_legal_data_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se dados já foram confirmados, bloqueia alteração de campos legais
  IF OLD.dados_confirmados = true THEN
    -- Bloqueia alteração do tipo de identificação
    IF OLD.type IS DISTINCT FROM NEW.type THEN
      RAISE EXCEPTION 'Tipo de identificação não pode ser alterado após confirmação dos dados legais';
    END IF;
    
    -- Bloqueia alteração do documento (CPF/CNPJ/Passaporte)
    IF OLD.documento IS DISTINCT FROM NEW.documento THEN
      RAISE EXCEPTION 'Documento de identificação não pode ser alterado após confirmação dos dados legais';
    END IF;
    
    -- Bloqueia alteração da razão social
    IF OLD.razao_social IS DISTINCT FROM NEW.razao_social THEN
      RAISE EXCEPTION 'Razão Social não pode ser alterada após confirmação dos dados legais';
    END IF;
    
    -- Bloqueia alteração do nome completo
    IF OLD.nome_completo IS DISTINCT FROM NEW.nome_completo THEN
      RAISE EXCEPTION 'Nome Completo não pode ser alterado após confirmação dos dados legais';
    END IF;
    
    -- Impede que dados_confirmados seja revertido para false
    IF NEW.dados_confirmados = false THEN
      RAISE EXCEPTION 'Flag de confirmação de dados legais não pode ser revertida';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para bloquear edição de dados legais
DROP TRIGGER IF EXISTS block_legal_data_update ON public.business_identity;
CREATE TRIGGER block_legal_data_update
  BEFORE UPDATE ON public.business_identity
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_legal_data_update();
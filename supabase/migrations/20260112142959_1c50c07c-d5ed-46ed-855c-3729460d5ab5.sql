-- Tabela para armazenar precificação por canal vinculada à receita mestre
-- Cada receita pode ter múltiplos preços (um por canal) sem duplicar a ficha técnica
CREATE TABLE public.recipe_channel_pricing (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    target_margin NUMERIC DEFAULT 30, -- Margem alvo específica para este canal (%)
    final_price NUMERIC DEFAULT 0, -- Preço final definido pelo usuário (pode ser diferente do sugerido)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(recipe_id, channel_id) -- Uma receita só pode ter uma precificação por canal
);

-- Enable RLS
ALTER TABLE public.recipe_channel_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own channel pricing"
ON public.recipe_channel_pricing
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channel pricing"
ON public.recipe_channel_pricing
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel pricing"
ON public.recipe_channel_pricing
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel pricing"
ON public.recipe_channel_pricing
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recipe_channel_pricing_updated_at
BEFORE UPDATE ON public.recipe_channel_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add card_fee and monthly_fee columns to sales_channels if they don't exist
ALTER TABLE public.sales_channels 
ADD COLUMN IF NOT EXISTS card_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC DEFAULT 0;
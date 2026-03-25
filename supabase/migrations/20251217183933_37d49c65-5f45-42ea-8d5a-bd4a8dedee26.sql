
-- 1. Criar tabela de histórico de entradas de estoque
CREATE TABLE public.inventory_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.inventory_entries ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
CREATE POLICY "Users can view own inventory entries"
ON public.inventory_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory entries"
ON public.inventory_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory entries"
ON public.inventory_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory entries"
ON public.inventory_entries FOR DELETE
USING (auth.uid() = user_id);

-- 4. Adicionar coluna de meta mínima de lucro em business_metrics
ALTER TABLE public.business_metrics 
ADD COLUMN IF NOT EXISTS min_profit_margin NUMERIC DEFAULT 30;

-- 5. Função para recalcular receitas após mudança de preço
CREATE OR REPLACE FUNCTION public.recalculate_recipes_on_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipe_record RECORD;
  ingredient_record RECORD;
  new_total_cost NUMERIC;
  packaging_cost NUMERIC;
  recipe_yield INTEGER;
  cost_per_unit NUMERIC;
  current_margin NUMERIC;
  user_min_margin NUMERIC;
  price_change_percent NUMERIC;
BEGIN
  -- Só executa se o custo unitário mudou
  IF OLD.unit_cost IS DISTINCT FROM NEW.unit_cost AND OLD.unit_cost > 0 THEN
    -- Calcula variação percentual do preço
    price_change_percent := ((NEW.unit_cost - OLD.unit_cost) / OLD.unit_cost) * 100;
    
    -- Busca todas as receitas que usam este insumo
    FOR recipe_record IN 
      SELECT DISTINCT r.id, r.user_id, r.name, r.yield, r.suggested_price, r.profit_margin
      FROM recipes r
      INNER JOIN ingredients i ON i.recipe_id = r.id
      WHERE i.inventory_item_id = NEW.id
    LOOP
      -- Calcula novo custo total dos ingredientes
      SELECT COALESCE(SUM((i.unit_price / NULLIF(i.package_qty, 0)) * i.used_qty * (1 + COALESCE(i.loss, 0) / 100)), 0)
      INTO new_total_cost
      FROM ingredients i
      WHERE i.recipe_id = recipe_record.id;
      
      -- Calcula custo de embalagens
      SELECT COALESCE(SUM((p.package_price / NULLIF(p.package_qty, 0)) * p.used_qty), 0)
      INTO packaging_cost
      FROM packaging p
      WHERE p.recipe_id = recipe_record.id;
      
      new_total_cost := new_total_cost + packaging_cost;
      cost_per_unit := new_total_cost / NULLIF(recipe_record.yield, 1);
      
      -- Calcula nova margem se há preço sugerido
      IF recipe_record.suggested_price > 0 THEN
        current_margin := ((recipe_record.suggested_price - cost_per_unit) / recipe_record.suggested_price) * 100;
        
        -- Busca meta mínima do usuário
        SELECT COALESCE(min_profit_margin, 30) INTO user_min_margin
        FROM business_metrics
        WHERE user_id = recipe_record.user_id
        LIMIT 1;
        
        -- Gera notificação se margem caiu abaixo do mínimo OU preço variou mais de 10%
        IF current_margin < user_min_margin OR ABS(price_change_percent) > 10 THEN
          INSERT INTO notifications (user_id, type, title, message, action_link, reference_id)
          VALUES (
            recipe_record.user_id,
            'profit_alert',
            'Alerta de Erosão de Lucro',
            format('O insumo "%s" variou %.1f%%. A margem da receita "%s" está em %.1f%% (meta: %.1f%%). Revise o preço de venda.',
              NEW.name, price_change_percent, recipe_record.name, current_margin, user_min_margin),
            '/receitas',
            recipe_record.id::text
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Criar trigger para executar após atualização de preço
DROP TRIGGER IF EXISTS trigger_recalculate_recipes ON public.inventory_items;
CREATE TRIGGER trigger_recalculate_recipes
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_recipes_on_price_change();

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventory_entries_item_id ON public.inventory_entries(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_entries_user_id ON public.inventory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_entries_purchase_date ON public.inventory_entries(purchase_date);
CREATE INDEX IF NOT EXISTS idx_ingredients_inventory_item_id ON public.ingredients(inventory_item_id);

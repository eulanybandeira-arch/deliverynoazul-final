-- Create stock movements history table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('venda', 'compra', 'ajuste')),
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock NUMERIC NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name TEXT,
  cash_flow_entry_id UUID REFERENCES public.cash_flow_entries(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own stock movements"
  ON public.stock_movements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock movements"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock movements"
  ON public.stock_movements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_stock_movements_inventory_item ON public.stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_user_date ON public.stock_movements(user_id, created_at DESC);
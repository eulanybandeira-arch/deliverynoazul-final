-- Create cash_flow_entries table
CREATE TABLE public.cash_flow_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saída')),
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('efetuado', 'agendado', 'vencido')),
  location TEXT NOT NULL CHECK (location IN ('conta_corrente', 'pix', 'dinheiro_fisico')),
  import_id TEXT,
  recipe_id UUID,
  quantity_sold NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own cash flow entries"
ON public.cash_flow_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash flow entries"
ON public.cash_flow_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash flow entries"
ON public.cash_flow_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash flow entries"
ON public.cash_flow_entries FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_cash_flow_user_date ON public.cash_flow_entries(user_id, date DESC);

-- Update trigger
CREATE TRIGGER update_cash_flow_entries_updated_at
BEFORE UPDATE ON public.cash_flow_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to inventory_items if they don't exist
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS purchase_unit TEXT DEFAULT 'unidade',
ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT 'unidade',
ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS cost_per_stock_unit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_logistics TEXT DEFAULT 'outros',
ADD COLUMN IF NOT EXISTS category_culinary TEXT,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_alert_unit TEXT DEFAULT 'unidade',
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS loss NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS package_capacity TEXT,
ADD COLUMN IF NOT EXISTS utensil_type TEXT,
ADD COLUMN IF NOT EXISTS initial_stock NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_purchased NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_used NUMERIC DEFAULT 0;
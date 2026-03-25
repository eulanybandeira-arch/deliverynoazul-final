
-- Tabela de motivos de desperdício
CREATE TABLE public.waste_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waste reasons" ON public.waste_reasons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waste reasons" ON public.waste_reasons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waste reasons" ON public.waste_reasons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waste reasons" ON public.waste_reasons FOR DELETE USING (auth.uid() = user_id);

-- Tabela de registros de desperdício
CREATE TABLE public.waste_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  reason_id uuid REFERENCES public.waste_reasons(id) ON DELETE SET NULL,
  reason_text text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waste entries" ON public.waste_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own waste entries" ON public.waste_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own waste entries" ON public.waste_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own waste entries" ON public.waste_entries FOR DELETE USING (auth.uid() = user_id);

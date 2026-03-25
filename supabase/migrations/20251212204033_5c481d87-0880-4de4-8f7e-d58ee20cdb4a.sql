-- Create equipment_items table
CREATE TABLE public.equipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  warranty_end DATE,
  maintenance_interval INTEGER,
  last_maintenance DATE,
  next_maintenance DATE,
  status TEXT DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own equipment items" 
ON public.equipment_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipment items" 
ON public.equipment_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipment items" 
ON public.equipment_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipment items" 
ON public.equipment_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_items_updated_at
BEFORE UPDATE ON public.equipment_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
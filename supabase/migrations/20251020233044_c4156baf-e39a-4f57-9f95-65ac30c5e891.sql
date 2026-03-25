-- Create table for inventory items
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  quantity_purchased NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_alert_level NUMERIC NOT NULL DEFAULT 0,
  expiry_date DATE,
  purchase_note_url TEXT,
  purchase_note_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own inventory items" 
ON public.inventory_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items" 
ON public.inventory_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory items" 
ON public.inventory_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for purchase notes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('purchase-notes', 'purchase-notes', false);

-- Storage policies for purchase notes
CREATE POLICY "Users can upload their own purchase notes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'purchase-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own purchase notes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'purchase-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own purchase notes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'purchase-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own purchase notes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'purchase-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Tabela de Bebidas
CREATE TABLE public.beverages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  purchase_unit TEXT NOT NULL DEFAULT 'unidade',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quantity_purchased NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_alert_level NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beverages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own beverages" ON public.beverages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own beverages" ON public.beverages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own beverages" ON public.beverages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own beverages" ON public.beverages FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Produtos de Limpeza
CREATE TABLE public.cleaning_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  purchase_unit TEXT NOT NULL DEFAULT 'unidade',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quantity_purchased NUMERIC NOT NULL DEFAULT 0,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_alert_level NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cleaning_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cleaning products" ON public.cleaning_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cleaning products" ON public.cleaning_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cleaning products" ON public.cleaning_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cleaning products" ON public.cleaning_products FOR DELETE USING (auth.uid() = user_id);

-- Tabela de Notas Fiscais
CREATE TABLE public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  file_url TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.purchase_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.purchase_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.purchase_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.purchase_invoices FOR DELETE USING (auth.uid() = user_id);

-- Tabela de mensagens do chat AI
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_beverages_user_id ON public.beverages(user_id);
CREATE INDEX idx_cleaning_products_user_id ON public.cleaning_products(user_id);
CREATE INDEX idx_purchase_invoices_user_id ON public.purchase_invoices(user_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
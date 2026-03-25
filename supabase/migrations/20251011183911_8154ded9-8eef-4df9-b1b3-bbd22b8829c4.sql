-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de identidade do negócio
CREATE TABLE public.business_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar tabela de métricas do negócio
CREATE TABLE public.business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_revenue DECIMAL(10,2) DEFAULT 8000,
  work_days INTEGER DEFAULT 26,
  work_days_per_week INTEGER DEFAULT 6,
  daily_target DECIMAL(10,2) DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar tabela de canais de venda
CREATE TABLE public.sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  platform_fee DECIMAL(5,2) DEFAULT 0,
  payment_fee DECIMAL(5,2) DEFAULT 0,
  anticipation_fee DECIMAL(5,2) DEFAULT 0,
  apply_anticipation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de receitas
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  yield INTEGER NOT NULL DEFAULT 1,
  profit_margin DECIMAL(5,2) DEFAULT 70,
  app_fee DECIMAL(5,2) DEFAULT 27,
  card_fee DECIMAL(5,2) DEFAULT 5,
  tax_fee DECIMAL(5,2) DEFAULT 0,
  suggested_price DECIMAL(10,2),
  category TEXT,
  tags TEXT[],
  fill_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de ingredientes
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  package_qty DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  used_qty DECIMAL(10,2) NOT NULL,
  loss DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de embalagens
CREATE TABLE public.packaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  package_qty DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  package_price DECIMAL(10,2) NOT NULL,
  used_qty DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de despesas fixas
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas RLS para business_identity
CREATE POLICY "Users can view own business identity" ON public.business_identity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business identity" ON public.business_identity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business identity" ON public.business_identity
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business identity" ON public.business_identity
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para business_metrics
CREATE POLICY "Users can view own business metrics" ON public.business_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business metrics" ON public.business_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business metrics" ON public.business_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business metrics" ON public.business_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para sales_channels
CREATE POLICY "Users can view own sales channels" ON public.sales_channels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales channels" ON public.sales_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales channels" ON public.sales_channels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales channels" ON public.sales_channels
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para recipes
CREATE POLICY "Users can view own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para ingredients
CREATE POLICY "Users can view ingredients of own recipes" ON public.ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients to own recipes" ON public.ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients of own recipes" ON public.ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients of own recipes" ON public.ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Políticas RLS para packaging
CREATE POLICY "Users can view packaging of own recipes" ON public.packaging
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = packaging.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert packaging to own recipes" ON public.packaging
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = packaging.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update packaging of own recipes" ON public.packaging
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = packaging.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete packaging of own recipes" ON public.packaging
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = packaging.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Políticas RLS para expenses
CREATE POLICY "Users can view expenses of own recipes" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = expenses.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses to own recipes" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = expenses.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses of own recipes" ON public.expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = expenses.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses of own recipes" ON public.expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = expenses.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_identity_updated_at BEFORE UPDATE ON public.business_identity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_updated_at BEFORE UPDATE ON public.business_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_channels_updated_at BEFORE UPDATE ON public.sales_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
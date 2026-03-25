
CREATE TABLE public.prep_base_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prep_base_id UUID REFERENCES public.prep_bases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  responsible TEXT NOT NULL,
  quantity_produced NUMERIC NOT NULL DEFAULT 1,
  production_unit TEXT NOT NULL DEFAULT 'Kg',
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prep_base_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prep base labels"
  ON public.prep_base_labels
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

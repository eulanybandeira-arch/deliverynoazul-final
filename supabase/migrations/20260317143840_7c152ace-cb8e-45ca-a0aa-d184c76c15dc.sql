
-- Subscriptions table to track Kiwify payments
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  kiwify_transaction_id text,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

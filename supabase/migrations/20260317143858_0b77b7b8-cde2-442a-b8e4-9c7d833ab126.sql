
-- Replace overly permissive policy with scoped service-role policies
DROP POLICY "Service role can manage subscriptions" ON public.subscriptions;

-- Webhook inserts via service role - restrict to service_role
CREATE POLICY "Service role can insert subscriptions" ON public.subscriptions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions" ON public.subscriptions
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role can delete subscriptions" ON public.subscriptions
  FOR DELETE TO service_role USING (true);

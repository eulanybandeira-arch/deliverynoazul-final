import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionData {
  status: string;
  plan: string;
  started_at: string | null;
  expires_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, plan, started_at, expires_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(data);
      setLoading(false);
    };

    fetchSubscription();
  }, [user]);

  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';

  // Routes allowed during trial
  const trialAllowedRoutes = [
    '/compras',
    '/receitas',
    '/receitas/biblioteca',
    '/receitas/new',
  ];

  const isRouteAllowed = (path: string) => {
    if (!isTrial) return true;
    // Allow recipe edit routes like /receitas/:id
    if (path.startsWith('/receitas/')) return true;
    return trialAllowedRoutes.includes(path);
  };

  return {
    subscription,
    loading,
    isTrial,
    isActive,
    isRouteAllowed,
    trialAllowedRoutes,
  };
}

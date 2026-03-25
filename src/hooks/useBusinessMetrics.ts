import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface BusinessMetrics {
  id?: string;
  user_id?: string;
  monthly_revenue: number;
  work_days: number;
  work_days_per_week: number;
  daily_target: number;
  min_profit_margin: number;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_METRICS: BusinessMetrics = {
  monthly_revenue: 8000,
  work_days: 26,
  work_days_per_week: 6,
  daily_target: 500,
  min_profit_margin: 30,
};

const EMPTY_METRICS: BusinessMetrics = {
  monthly_revenue: 0,
  work_days: 0,
  work_days_per_week: 0,
  daily_target: 0,
  min_profit_margin: 30,
};

export function useBusinessMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BusinessMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(EMPTY_METRICS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("business_metrics")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMetrics({
          id: data.id,
          user_id: data.user_id,
          monthly_revenue: data.monthly_revenue ?? 0,
          work_days: data.work_days ?? 0,
          work_days_per_week: data.work_days_per_week ?? 0,
          daily_target: data.daily_target ?? 0,
          min_profit_margin: (data as { min_profit_margin?: number }).min_profit_margin ?? 30,
          created_at: data.created_at || undefined,
          updated_at: data.updated_at || undefined,
        });
      } else {
        // No data exists - show empty values, don't auto-create
        setMetrics(EMPTY_METRICS);
      }
    } catch (error) {
      console.error("Error fetching business metrics:", error);
      setMetrics(EMPTY_METRICS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const updateMetrics = async (newMetrics: Partial<BusinessMetrics>) => {
    if (!user) return false;

    try {
      if (metrics.id) {
        // Update existing
        const { error } = await supabase
          .from("business_metrics")
          .update({
            monthly_revenue: newMetrics.monthly_revenue,
            work_days: newMetrics.work_days,
            work_days_per_week: newMetrics.work_days_per_week,
            daily_target: newMetrics.daily_target,
            min_profit_margin: newMetrics.min_profit_margin,
          })
          .eq("id", metrics.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("business_metrics")
          .insert({
            user_id: user.id,
            monthly_revenue: newMetrics.monthly_revenue ?? 0,
            work_days: newMetrics.work_days ?? 0,
            work_days_per_week: newMetrics.work_days_per_week ?? 0,
            daily_target: newMetrics.daily_target ?? 0,
            min_profit_margin: newMetrics.min_profit_margin ?? 30,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setMetrics({
            id: data.id,
            user_id: data.user_id,
            monthly_revenue: data.monthly_revenue ?? 0,
            work_days: data.work_days ?? 0,
            work_days_per_week: data.work_days_per_week ?? 0,
            daily_target: data.daily_target ?? 0,
            min_profit_margin: (data as { min_profit_margin?: number }).min_profit_margin ?? 30,
          });
          return true;
        }
      }
      
      setMetrics((prev) => ({ ...prev, ...newMetrics }));
      return true;
    } catch (error) {
      console.error("Error updating business metrics:", error);
      toast.error("Erro ao atualizar métricas");
      return false;
    }
  };

  const deleteMetrics = async () => {
    if (!user || !metrics.id) return false;

    try {
      const { error } = await supabase
        .from("business_metrics")
        .delete()
        .eq("id", metrics.id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Set to empty values (zeroed), not default values
      setMetrics(EMPTY_METRICS);
      toast.success("Métricas excluídas com sucesso");
      return true;
    } catch (error) {
      console.error("Error deleting business metrics:", error);
      toast.error("Erro ao excluir métricas");
      return false;
    }
  };

  return {
    metrics,
    loading,
    updateMetrics,
    deleteMetrics,
    refetch: fetchMetrics,
  };
}

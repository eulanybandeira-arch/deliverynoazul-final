import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface ChannelPricing {
  id: string;
  recipeId: string;
  channelId: string;
  targetMargin: number;
  finalPrice: number;
  isActive: boolean;
}

export function useChannelPricing(recipeId: string | undefined) {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<ChannelPricing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPricing = useCallback(async () => {
    if (!user || !recipeId || recipeId === "new") {
      setPricing([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recipe_channel_pricing")
        .select("*")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id);

      if (error) throw error;

      const formattedPricing: ChannelPricing[] = (data || []).map((p) => ({
        id: p.id,
        recipeId: p.recipe_id,
        channelId: p.channel_id,
        targetMargin: p.target_margin || 30,
        finalPrice: p.final_price || 0,
        isActive: p.is_active ?? true,
      }));

      setPricing(formattedPricing);
    } catch (error: any) {
      console.error("Error fetching channel pricing:", error);
    } finally {
      setLoading(false);
    }
  }, [user, recipeId]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const upsertPricing = async (
    channelId: string,
    targetMargin: number,
    finalPrice: number,
    actualRecipeId?: string,
    isActive?: boolean
  ) => {
    const effectiveRecipeId = actualRecipeId || recipeId;
    if (!user || !effectiveRecipeId || effectiveRecipeId === "new") {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("recipe_channel_pricing")
        .upsert(
          {
            recipe_id: effectiveRecipeId,
            channel_id: channelId,
            user_id: user.id,
            target_margin: targetMargin,
            final_price: finalPrice,
            is_active: isActive ?? true,
          },
          {
            onConflict: "recipe_id,channel_id",
          }
        )
        .select()
        .single();

      if (error) throw error;

      const newPricing: ChannelPricing = {
        id: data.id,
        recipeId: data.recipe_id,
        channelId: data.channel_id,
        targetMargin: data.target_margin || 30,
        finalPrice: data.final_price || 0,
        isActive: data.is_active ?? true,
      };

      setPricing((prev) => {
        const exists = prev.find((p) => p.channelId === channelId);
        if (exists) {
          return prev.map((p) => (p.channelId === channelId ? newPricing : p));
        }
        return [...prev, newPricing];
      });

      return newPricing;
    } catch (error: any) {
      console.error("Error upserting channel pricing:", error);
      toast.error("Erro ao salvar precificação do canal");
      return null;
    }
  };

  const updateLocalPricing = (channelId: string, updates: Partial<ChannelPricing>) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.channelId === channelId ? { ...p, ...updates } : p
      )
    );
  };

  const getChannelPricing = (channelId: string): ChannelPricing | undefined => {
    return pricing.find((p) => p.channelId === channelId);
  };

  const saveBulkPricing = async (
    pricingData: Array<{ channelId: string; targetMargin: number; finalPrice: number; isActive?: boolean }>,
    actualRecipeId: string
  ) => {
    if (!user || !actualRecipeId) return false;

    try {
      const records = pricingData.map((p) => ({
        recipe_id: actualRecipeId,
        channel_id: p.channelId,
        user_id: user.id,
        target_margin: p.targetMargin,
        final_price: p.finalPrice,
        is_active: p.isActive ?? true,
      }));

      const { error } = await supabase
        .from("recipe_channel_pricing")
        .upsert(records, { onConflict: "recipe_id,channel_id" });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Error saving bulk pricing:", error);
      toast.error("Erro ao salvar precificação dos canais");
      return false;
    }
  };

  return {
    pricing,
    loading,
    upsertPricing,
    updateLocalPricing,
    getChannelPricing,
    saveBulkPricing,
    refetch: fetchPricing,
  };
}

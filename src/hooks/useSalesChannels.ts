import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SalesChannel } from "@/types/pricing";

const DEFAULT_CHANNELS: Omit<SalesChannel, "id">[] = [
  {
    name: "iFood Entrega",
    platformFee: 23,
    paymentFee: 3.2,
    cardFee: 0,
    anticipationFee: 1.59,
    applyAnticipation: true,
    monthlyFee: 150,
  },
  {
    name: "iFood Básico",
    platformFee: 12,
    paymentFee: 3.2,
    cardFee: 0,
    anticipationFee: 1.59,
    applyAnticipation: true,
    monthlyFee: 110,
  },
  {
    name: "99Food Plano Flex",
    platformFee: 8.9,
    paymentFee: 3.2,
    cardFee: 0,
    anticipationFee: 0,
    applyAnticipation: false,
    monthlyFee: 0,
  },
  {
    name: "99Food Plano Fixo",
    platformFee: 0,
    paymentFee: 3.2,
    cardFee: 0,
    anticipationFee: 0,
    applyAnticipation: false,
    monthlyFee: 150,
  },
  {
    name: "Rappi",
    platformFee: 0,
    paymentFee: 3.5,
    cardFee: 0,
    anticipationFee: 1.5,
    applyAnticipation: true,
    monthlyFee: 0,
  },
  {
    name: "Sistema Próprio",
    platformFee: 0,
    paymentFee: 0,
    cardFee: 0,
    anticipationFee: 0,
    applyAnticipation: false,
    monthlyFee: 0,
  },
  {
    name: "WhatsApp",
    platformFee: 0,
    paymentFee: 0,
    cardFee: 0,
    anticipationFee: 0,
    applyAnticipation: false,
    monthlyFee: 0,
  },
];

export function useSalesChannels() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!user) {
      setChannels([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sales_channels")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedChannels: SalesChannel[] = (data || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        platformFee: ch.platform_fee || 0,
        paymentFee: ch.payment_fee || 0,
        cardFee: 0,
        anticipationFee: ch.anticipation_fee || 0,
        applyAnticipation: ch.apply_anticipation || false,
        monthlyFee: 0,
      }));

      // If no channels, initialize with defaults
      if (formattedChannels.length === 0) {
        await initializeDefaultChannels();
      } else {
        setChannels(formattedChannels);
      }
    } catch (error: any) {
      console.error("Error fetching sales channels:", error);
      toast.error("Erro ao carregar canais de venda");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const initializeDefaultChannels = async () => {
    if (!user) return;

    try {
      const channelsToInsert = DEFAULT_CHANNELS.map((ch) => ({
        user_id: user.id,
        name: ch.name,
        platform_fee: ch.platformFee,
        payment_fee: ch.paymentFee,
        anticipation_fee: ch.anticipationFee,
        apply_anticipation: ch.applyAnticipation,
      }));

      const { data, error } = await supabase
        .from("sales_channels")
        .insert(channelsToInsert)
        .select();

      if (error) throw error;

      const formattedChannels: SalesChannel[] = (data || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        platformFee: ch.platform_fee || 0,
        paymentFee: ch.payment_fee || 0,
        cardFee: 0,
        anticipationFee: ch.anticipation_fee || 0,
        applyAnticipation: ch.apply_anticipation || false,
        monthlyFee: 0,
      }));

      setChannels(formattedChannels);
    } catch (error) {
      console.error("Error initializing default channels:", error);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const addChannel = async (channelData: Omit<SalesChannel, "id">) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("sales_channels")
        .insert({
          user_id: user.id,
          name: channelData.name,
          platform_fee: channelData.platformFee,
          payment_fee: channelData.paymentFee,
          anticipation_fee: channelData.anticipationFee,
          apply_anticipation: channelData.applyAnticipation,
        })
        .select()
        .single();

      if (error) throw error;

      const newChannel: SalesChannel = {
        id: data.id,
        name: data.name,
        platformFee: data.platform_fee || 0,
        paymentFee: data.payment_fee || 0,
        cardFee: 0,
        anticipationFee: data.anticipation_fee || 0,
        applyAnticipation: data.apply_anticipation || false,
        monthlyFee: 0,
      };

      setChannels((prev) => [...prev, newChannel]);
      return newChannel;
    } catch (error: any) {
      console.error("Error adding sales channel:", error);
      toast.error("Erro ao adicionar canal de venda");
      return null;
    }
  };

  const updateChannel = async (id: string, channelData: Partial<SalesChannel>) => {
    try {
      const updateData: any = {};
      if (channelData.name !== undefined) updateData.name = channelData.name;
      if (channelData.platformFee !== undefined) updateData.platform_fee = channelData.platformFee;
      if (channelData.paymentFee !== undefined) updateData.payment_fee = channelData.paymentFee;
      if (channelData.anticipationFee !== undefined) updateData.anticipation_fee = channelData.anticipationFee;
      if (channelData.applyAnticipation !== undefined) updateData.apply_anticipation = channelData.applyAnticipation;

      const { data, error } = await supabase
        .from("sales_channels")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === id
            ? {
                ...ch,
                name: data.name,
                platformFee: data.platform_fee || 0,
                paymentFee: data.payment_fee || 0,
                anticipationFee: data.anticipation_fee || 0,
                applyAnticipation: data.apply_anticipation || false,
              }
            : ch
        )
      );
      return data;
    } catch (error: any) {
      console.error("Error updating sales channel:", error);
      toast.error("Erro ao atualizar canal de venda");
      return null;
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sales_channels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setChannels((prev) => prev.filter((ch) => ch.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting sales channel:", error);
      toast.error("Erro ao excluir canal de venda");
      return false;
    }
  };

  return {
    channels,
    loading,
    addChannel,
    updateChannel,
    deleteChannel,
    refetch: fetchChannels,
  };
}

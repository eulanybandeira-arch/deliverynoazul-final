import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface InventoryEntry {
  id: string;
  inventory_item_id: string;
  user_id: string;
  purchase_date: string;
  unit_cost: number;
  quantity: number;
  total_cost: number;
  supplier?: string;
  brand?: string;
  created_at: string;
}

export interface PriceVariation {
  month: string;
  purchases: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  variationPercent: number;
}

export function useInventoryEntries(inventoryItemId?: string) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("inventory_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      if (inventoryItemId) {
        query = query.eq("inventory_item_id", inventoryItemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as InventoryEntry[]) || []);
    } catch (error) {
      console.error("Error fetching inventory entries:", error);
      toast.error("Erro ao carregar histórico de entradas");
    } finally {
      setLoading(false);
    }
  }, [user, inventoryItemId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entryData: Omit<InventoryEntry, "id" | "user_id" | "created_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("inventory_entries")
        .insert({
          ...entryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setEntries((prev) => [data as InventoryEntry, ...prev]);
      return data as InventoryEntry;
    } catch (error) {
      console.error("Error adding inventory entry:", error);
      toast.error("Erro ao adicionar entrada");
      return null;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting inventory entry:", error);
      toast.error("Erro ao excluir entrada");
      return false;
    }
  };

  // Calcula variação de preços por mês
  const getPriceVariation = useCallback((): PriceVariation[] => {
    if (entries.length === 0) return [];

    const monthlyData: Record<string, { prices: number[]; count: number }> = {};

    entries.forEach((entry) => {
      const date = new Date(entry.purchase_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { prices: [], count: 0 };
      }
      
      monthlyData[monthKey].prices.push(entry.unit_cost);
      monthlyData[monthKey].count++;
    });

    const variations: PriceVariation[] = Object.entries(monthlyData)
      .map(([month, data]) => {
        const minPrice = Math.min(...data.prices);
        const maxPrice = Math.max(...data.prices);
        const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        const variationPercent = minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;

        return {
          month,
          purchases: data.count,
          minPrice,
          maxPrice,
          avgPrice,
          variationPercent,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    return variations;
  }, [entries]);

  return {
    entries,
    loading,
    addEntry,
    deleteEntry,
    getPriceVariation,
    refetch: fetchEntries,
  };
}

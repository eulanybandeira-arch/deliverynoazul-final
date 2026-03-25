import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface CleaningProduct {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  purchase_unit: string;
  unit_cost: number;
  quantity_purchased: number;
  current_stock: number;
  min_alert_level: number;
  total_cost: number;
  purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export function useCleaningProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState<CleaningProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cleaning_products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as CleaningProduct[]) || []);
    } catch (error) {
      console.error("Error fetching cleaning products:", error);
      toast.error("Erro ao carregar produtos de limpeza");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (itemData: Omit<CleaningProduct, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("cleaning_products")
        .insert({
          ...itemData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => [data as CleaningProduct, ...prev]);
      return data as CleaningProduct;
    } catch (error) {
      console.error("Error adding cleaning product:", error);
      toast.error("Erro ao adicionar produto de limpeza");
      return null;
    }
  };

  const updateItem = async (id: string, itemData: Partial<CleaningProduct>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("cleaning_products")
        .update(itemData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...itemData } : item))
      );
      return true;
    } catch (error) {
      console.error("Error updating cleaning product:", error);
      toast.error("Erro ao atualizar produto de limpeza");
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("cleaning_products")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting cleaning product:", error);
      toast.error("Erro ao excluir produto de limpeza");
      return false;
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}

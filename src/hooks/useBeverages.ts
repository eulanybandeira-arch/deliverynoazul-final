import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface BeverageItem {
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
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export function useBeverages() {
  const { user } = useAuth();
  const [items, setItems] = useState<BeverageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("beverages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as BeverageItem[]) || []);
    } catch (error) {
      console.error("Error fetching beverages:", error);
      toast.error("Erro ao carregar bebidas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (itemData: Omit<BeverageItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("beverages")
        .insert({
          ...itemData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => [data as BeverageItem, ...prev]);
      return data as BeverageItem;
    } catch (error) {
      console.error("Error adding beverage:", error);
      toast.error("Erro ao adicionar bebida");
      return null;
    }
  };

  const updateItem = async (id: string, itemData: Partial<BeverageItem>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("beverages")
        .update(itemData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...itemData } : item))
      );
      return true;
    } catch (error) {
      console.error("Error updating beverage:", error);
      toast.error("Erro ao atualizar bebida");
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("beverages")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting beverage:", error);
      toast.error("Erro ao excluir bebida");
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

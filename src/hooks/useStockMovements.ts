import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface StockMovement {
  id: string;
  user_id: string;
  inventory_item_id: string;
  movement_type: 'venda' | 'compra' | 'ajuste';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  recipe_id?: string;
  recipe_name?: string;
  cash_flow_entry_id?: string;
  notes?: string;
  created_at: string;
  // Joined fields
  inventory_item?: {
    name: string;
    stock_unit: string;
  };
}

export function useStockMovements(inventoryItemId?: string) {
  const { user } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    if (!user) {
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          inventory_item:inventory_items(name, stock_unit)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (inventoryItemId) {
        query = query.eq("inventory_item_id", inventoryItemId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setMovements((data as StockMovement[]) || []);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
    }
  }, [user, inventoryItemId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const addMovement = async (movementData: {
    inventory_item_id: string;
    movement_type: 'venda' | 'compra' | 'ajuste';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    recipe_id?: string;
    recipe_name?: string;
    cash_flow_entry_id?: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          ...movementData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding stock movement:", error);
      return null;
    }
  };

  return {
    movements,
    loading,
    addMovement,
    refetch: fetchMovements,
  };
}

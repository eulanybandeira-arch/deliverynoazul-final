import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  purchase_unit: string;
  stock_unit: string;
  conversion_factor: number;
  cost_per_stock_unit: number;
  category_logistics: string;
  category_culinary?: string;
  unit_cost: number;
  total_cost: number;
  quantity_purchased: number;
  current_stock: number;
  min_alert_level: number;
  min_alert_unit: string;
  purchase_date?: string;
  expiry_date?: string;
  purchase_note_id?: string;
  purchase_note_url?: string;
  purchase_note_link?: string;
  created_at: string;
  updated_at: string;
  loss?: number;
  package_capacity?: string;
  utensil_type?: string;
  initial_stock?: number;
  total_purchased?: number;
  total_used?: number;
  unit?: string;
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as InventoryItem[]) || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Erro ao carregar inventário");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (itemData: Omit<InventoryItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      // Calcular current_stock corretamente: quantidade comprada * fator de conversão
      const quantityPurchased = itemData.quantity_purchased || 0;
      const conversionFactor = itemData.conversion_factor || 1;
      const calculatedCurrentStock = quantityPurchased * conversionFactor;

      const insertData = {
        name: itemData.name,
        unit: itemData.unit || itemData.stock_unit,
        user_id: user.id,
        brand: itemData.brand,
        purchase_unit: itemData.purchase_unit,
        stock_unit: itemData.stock_unit,
        conversion_factor: conversionFactor,
        cost_per_stock_unit: itemData.cost_per_stock_unit,
        category_logistics: itemData.category_logistics,
        category_culinary: itemData.category_culinary,
        unit_cost: itemData.unit_cost,
        total_cost: itemData.total_cost,
        quantity_purchased: quantityPurchased,
        current_stock: calculatedCurrentStock,
        min_alert_level: itemData.min_alert_level,
        min_alert_unit: itemData.min_alert_unit,
        purchase_date: itemData.purchase_date,
        expiry_date: itemData.expiry_date,
        purchase_note_url: itemData.purchase_note_url,
        purchase_note_link: itemData.purchase_note_link,
        loss: itemData.loss,
        package_capacity: itemData.package_capacity,
        utensil_type: itemData.utensil_type,
        initial_stock: calculatedCurrentStock,
        total_purchased: quantityPurchased,
        total_used: itemData.total_used,
      };

      const { data, error } = await supabase
        .from("inventory_items")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Registrar entrada no histórico de preços
      if (data) {
        await supabase.from("inventory_entries").insert({
          inventory_item_id: data.id,
          user_id: user.id,
          purchase_date: itemData.purchase_date || new Date().toISOString().split("T")[0],
          unit_cost: itemData.unit_cost || 0,
          quantity: quantityPurchased,
          total_cost: itemData.total_cost || 0,
          brand: itemData.brand,
        });

        // Registrar movimentação de estoque
        await supabase.from("stock_movements").insert({
          inventory_item_id: data.id,
          user_id: user.id,
          movement_type: 'compra',
          quantity: calculatedCurrentStock,
          previous_stock: 0,
          new_stock: calculatedCurrentStock,
          notes: `Cadastro inicial - ${quantityPurchased} ${itemData.purchase_unit}`,
        });
      }

      setItems((prev) => [data as InventoryItem, ...prev]);
      return data as InventoryItem;
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast.error("Erro ao adicionar item");
      return null;
    }
  };

  const updateItem = async (id: string, itemData: Partial<InventoryItem>) => {
    if (!user) return false;

    try {
      // Busca item atual para verificar mudança de preço
      const currentItem = items.find((item) => item.id === id);
      const priceChanged = currentItem && itemData.unit_cost !== undefined && 
                          itemData.unit_cost !== currentItem.unit_cost;

      const { error } = await supabase
        .from("inventory_items")
        .update(itemData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      // Registra no histórico se o preço mudou
      if (priceChanged && itemData.unit_cost !== undefined) {
        await supabase.from("inventory_entries").insert({
          inventory_item_id: id,
          user_id: user.id,
          purchase_date: itemData.purchase_date || new Date().toISOString().split("T")[0],
          unit_cost: itemData.unit_cost,
          quantity: itemData.quantity_purchased || currentItem?.quantity_purchased || 0,
          total_cost: itemData.total_cost || (itemData.unit_cost * (itemData.quantity_purchased || currentItem?.quantity_purchased || 0)),
          brand: itemData.brand || currentItem?.brand,
        });
      }

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...itemData } : item))
      );
      return true;
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast.error("Erro ao atualizar item");
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("Erro ao excluir item");
      return false;
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    return updateItem(id, { current_stock: newStock });
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateStock,
    refetch: fetchItems,
  };
}

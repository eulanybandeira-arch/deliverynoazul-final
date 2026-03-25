import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { EquipmentItem } from "@/types/equipment";

export function useEquipment() {
  const { user } = useAuth();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("equipment_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map database fields to interface
      const mappedItems: EquipmentItem[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        brand: item.brand,
        model: item.model,
        serial_number: item.serial_number,
        purchase_date: item.purchase_date,
        purchase_value: item.purchase_value || 0,
        current_value: item.current_value || 0,
        warranty_end: item.warranty_end,
        maintenance_interval: item.maintenance_interval,
        last_maintenance: item.last_maintenance,
        next_maintenance: item.next_maintenance,
        status: item.status || 'ativo',
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setItems(mappedItems);
    } catch (error: any) {
      console.error("Error fetching equipment:", error);
      toast.error("Erro ao carregar equipamentos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (itemData: Omit<EquipmentItem, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("equipment_items")
        .insert({
          user_id: user.id,
          name: itemData.name,
          brand: itemData.brand,
          model: itemData.model,
          serial_number: itemData.serial_number,
          purchase_date: itemData.purchase_date || null,
          purchase_value: itemData.purchase_value || 0,
          current_value: itemData.current_value || itemData.purchase_value || 0,
          warranty_end: itemData.warranty_end || null,
          maintenance_interval: itemData.maintenance_interval || null,
          last_maintenance: itemData.last_maintenance || null,
          next_maintenance: itemData.next_maintenance || null,
          status: itemData.status || 'ativo',
          notes: itemData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newItem: EquipmentItem = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        brand: data.brand,
        model: data.model,
        serial_number: data.serial_number,
        purchase_date: data.purchase_date,
        purchase_value: data.purchase_value || 0,
        current_value: data.current_value || 0,
        warranty_end: data.warranty_end,
        maintenance_interval: data.maintenance_interval,
        last_maintenance: data.last_maintenance,
        next_maintenance: data.next_maintenance,
        status: data.status || 'ativo',
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      setItems((prev) => [newItem, ...prev]);
      return newItem;
    } catch (error: any) {
      console.error("Error adding equipment:", error);
      toast.error("Erro ao adicionar equipamento");
      return null;
    }
  };

  const updateItem = async (id: string, itemData: Partial<EquipmentItem>) => {
    try {
      const updateData: any = {};
      if (itemData.name !== undefined) updateData.name = itemData.name;
      if (itemData.brand !== undefined) updateData.brand = itemData.brand;
      if (itemData.model !== undefined) updateData.model = itemData.model;
      if (itemData.serial_number !== undefined) updateData.serial_number = itemData.serial_number;
      if (itemData.purchase_date !== undefined) updateData.purchase_date = itemData.purchase_date || null;
      if (itemData.purchase_value !== undefined) updateData.purchase_value = itemData.purchase_value;
      if (itemData.current_value !== undefined) updateData.current_value = itemData.current_value;
      if (itemData.warranty_end !== undefined) updateData.warranty_end = itemData.warranty_end || null;
      if (itemData.maintenance_interval !== undefined) updateData.maintenance_interval = itemData.maintenance_interval;
      if (itemData.last_maintenance !== undefined) updateData.last_maintenance = itemData.last_maintenance || null;
      if (itemData.next_maintenance !== undefined) updateData.next_maintenance = itemData.next_maintenance || null;
      if (itemData.status !== undefined) updateData.status = itemData.status;
      if (itemData.notes !== undefined) updateData.notes = itemData.notes;

      const { data, error } = await supabase
        .from("equipment_items")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedItem: EquipmentItem = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        brand: data.brand,
        model: data.model,
        serial_number: data.serial_number,
        purchase_date: data.purchase_date,
        purchase_value: data.purchase_value || 0,
        current_value: data.current_value || 0,
        warranty_end: data.warranty_end,
        maintenance_interval: data.maintenance_interval,
        last_maintenance: data.last_maintenance,
        next_maintenance: data.next_maintenance,
        status: data.status || 'ativo',
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
      return updatedItem;
    } catch (error: any) {
      console.error("Error updating equipment:", error);
      toast.error("Erro ao atualizar equipamento");
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("equipment_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting equipment:", error);
      toast.error("Erro ao excluir equipamento");
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

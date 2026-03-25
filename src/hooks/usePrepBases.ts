import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { PrepBase, PrepBaseIngredient, PrepBaseLabel } from "@/types/prep-base";

export function usePrepBases() {
  const { user } = useAuth();
  const [items, setItems] = useState<PrepBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("prep_bases")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      setItems((data as PrepBase[]) || []);
    } catch (error) {
      console.error("Error fetching prep bases:", error);
      toast.error("Erro ao carregar bases de preparo");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createPrepBase = async (
    base: Omit<PrepBase, "id" | "user_id" | "created_at" | "updated_at">,
    ingredients: Omit<PrepBaseIngredient, "id" | "prep_base_id" | "created_at">[]
  ) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("prep_bases")
        .insert({ ...base, user_id: user.id })
        .select()
        .single();
      if (error) throw error;

      if (ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map((ing) => ({
          ...ing,
          prep_base_id: data.id,
        }));
        const { error: ingError } = await supabase
          .from("prep_base_ingredients")
          .insert(ingredientsToInsert);
        if (ingError) throw ingError;
      }

      setItems((prev) => [...prev, data as PrepBase].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`"${data.name}" adicionado com sucesso!`);
      return data as PrepBase;
    } catch (error) {
      console.error("Error creating prep base:", error);
      toast.error("Erro ao criar base de preparo");
      return null;
    }
  };

  const updatePrepBase = async (id: string, updates: Partial<PrepBase>) => {
    try {
      const { error } = await supabase.from("prep_bases").update(updates).eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      toast.success("Atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating prep base:", error);
      toast.error("Erro ao atualizar");
    }
  };

  const deletePrepBase = async (id: string) => {
    try {
      const { error } = await supabase.from("prep_bases").delete().eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Removido com sucesso!");
    } catch (error) {
      console.error("Error deleting prep base:", error);
      toast.error("Erro ao remover");
    }
  };

  // Ingredients
  const getIngredients = async (prepBaseId: string): Promise<PrepBaseIngredient[]> => {
    const { data, error } = await supabase
      .from("prep_base_ingredients")
      .select("*")
      .eq("prep_base_id", prepBaseId);
    if (error) {
      console.error("Error fetching ingredients:", error);
      return [];
    }
    return (data as PrepBaseIngredient[]) || [];
  };

  const saveIngredients = async (prepBaseId: string, ingredients: Omit<PrepBaseIngredient, "id" | "prep_base_id" | "created_at">[]) => {
    try {
      await supabase.from("prep_base_ingredients").delete().eq("prep_base_id", prepBaseId);
      if (ingredients.length > 0) {
        const { error } = await supabase.from("prep_base_ingredients").insert(
          ingredients.map((ing) => ({ ...ing, prep_base_id: prepBaseId }))
        );
        if (error) throw error;
      }

      // Recalculate costs
      const totalCost = ingredients.reduce((sum, ing) => {
        const usedValue = (ing.used_qty / ing.package_qty) * ing.unit_price;
        return sum + usedValue;
      }, 0);

      const base = items.find((b) => b.id === prepBaseId);
      const unitCost = base && base.yield_amount > 0 ? totalCost / base.yield_amount : 0;

      await supabase.from("prep_bases").update({ total_cost: totalCost, unit_cost: unitCost }).eq("id", prepBaseId);
      setItems((prev) =>
        prev.map((item) => (item.id === prepBaseId ? { ...item, total_cost: totalCost, unit_cost: unitCost } : item))
      );

      toast.success("Ingredientes salvos!");
    } catch (error) {
      console.error("Error saving ingredients:", error);
      toast.error("Erro ao salvar ingredientes");
    }
  };

  // Labels
  const getLabels = async (prepBaseId: string): Promise<PrepBaseLabel[]> => {
    const { data, error } = await supabase
      .from("prep_base_labels")
      .select("*")
      .eq("prep_base_id", prepBaseId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching labels:", error);
      return [];
    }
    return (data as PrepBaseLabel[]) || [];
  };

  const createLabel = async (label: Omit<PrepBaseLabel, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("prep_base_labels")
        .insert(label)
        .select()
        .single();
      if (error) throw error;
      toast.success("Etiqueta criada com sucesso!");
      return data as PrepBaseLabel;
    } catch (error) {
      console.error("Error creating label:", error);
      toast.error("Erro ao criar etiqueta");
      return null;
    }
  };

  const deleteLabel = async (id: string) => {
    try {
      const { error } = await supabase.from("prep_base_labels").delete().eq("id", id);
      if (error) throw error;
      toast.success("Etiqueta removida!");
    } catch (error) {
      console.error("Error deleting label:", error);
      toast.error("Erro ao remover etiqueta");
    }
  };

  return {
    items,
    isLoading,
    createPrepBase,
    updatePrepBase,
    deletePrepBase,
    getIngredients,
    saveIngredients,
    getLabels,
    createLabel,
    deleteLabel,
    refetch: fetchItems,
  };
}

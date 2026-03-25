import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface CashFlowEntry {
  id: string;
  user_id: string;
  date: string;
  description: string;
  value: number;
  type: "entrada" | "saída";
  category: string;
  status: "efetuado" | "agendado" | "vencido";
  location: "conta_corrente" | "pix" | "dinheiro_fisico";
  import_id?: string;
  recipe_id?: string;
  quantity_sold?: number;
  created_at: string;
  updated_at: string;
}

export function useCashFlow() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cash_flow_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setEntries((data as CashFlowEntry[]) || []);
    } catch (error) {
      console.error("Error fetching cash flow:", error);
      toast.error("Erro ao carregar fluxo de caixa");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entryData: Omit<CashFlowEntry, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("cash_flow_entries")
        .insert({
          ...entryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setEntries((prev) => [data as CashFlowEntry, ...prev]);
      return data as CashFlowEntry;
    } catch (error) {
      console.error("Error adding cash flow entry:", error);
      toast.error("Erro ao adicionar lançamento");
      return null;
    }
  };

  const updateEntry = async (id: string, entryData: Partial<CashFlowEntry>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("cash_flow_entries")
        .update(entryData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...entryData } : entry))
      );
      return true;
    } catch (error) {
      console.error("Error updating cash flow entry:", error);
      toast.error("Erro ao atualizar lançamento");
      return false;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("cash_flow_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting cash flow entry:", error);
      toast.error("Erro ao excluir lançamento");
      return false;
    }
  };

  const importEntries = async (importedEntries: Omit<CashFlowEntry, "id" | "user_id" | "created_at" | "updated_at">[]) => {
    if (!user || importedEntries.length === 0) return 0;

    // Filter out duplicates based on import_id
    const existingImportIds = new Set(entries.map((e) => e.import_id).filter(Boolean));
    const newEntries = importedEntries.filter((e) => !existingImportIds.has(e.import_id));

    if (newEntries.length === 0) return 0;

    try {
      const { data, error } = await supabase
        .from("cash_flow_entries")
        .insert(newEntries.map((e) => ({ ...e, user_id: user.id })))
        .select();

      if (error) throw error;
      setEntries((prev) => [...(data as CashFlowEntry[]), ...prev]);
      return data?.length || 0;
    } catch (error) {
      console.error("Error importing entries:", error);
      toast.error("Erro ao importar lançamentos");
      return 0;
    }
  };

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    refetch: fetchEntries,
  };
}

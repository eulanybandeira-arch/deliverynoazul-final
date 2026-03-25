import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { WasteEntry, WasteReason } from "@/types/waste";

export function useWaste() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ["waste-entries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_entries" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WasteEntry[];
    },
    enabled: !!user,
  });

  const reasonsQuery = useQuery({
    queryKey: ["waste-reasons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_reasons" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as WasteReason[];
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<WasteEntry, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("waste_entries" as any).insert(entry as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waste-entries"] });
      toast.success("Desperdício registrado!");
    },
    onError: () => toast.error("Erro ao registrar desperdício"),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waste_entries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waste-entries"] });
      toast.success("Registro excluído!");
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const addReason = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("waste_reasons" as any)
        .insert({ user_id: user!.id, name } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waste-reasons"] });
      toast.success("Motivo adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar motivo"),
  });

  const deleteReason = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waste_reasons" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waste-reasons"] });
      toast.success("Motivo excluído!");
    },
    onError: () => toast.error("Erro ao excluir motivo"),
  });

  return {
    entries: entriesQuery.data || [],
    reasons: reasonsQuery.data || [],
    isLoading: entriesQuery.isLoading || reasonsQuery.isLoading,
    addEntry: addEntry.mutateAsync,
    deleteEntry: deleteEntry.mutateAsync,
    addReason: addReason.mutateAsync,
    deleteReason: deleteReason.mutateAsync,
  };
}

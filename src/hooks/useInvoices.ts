import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface PurchaseInvoice {
  id: string;
  user_id: string;
  description: string;
  date: string;
  file_url?: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setInvoices((data as PurchaseInvoice[]) || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Erro ao carregar notas fiscais");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const addInvoice = async (invoiceData: Omit<PurchaseInvoice, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .insert({
          ...invoiceData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setInvoices((prev) => [data as PurchaseInvoice, ...prev]);
      return data as PurchaseInvoice;
    } catch (error) {
      console.error("Error adding invoice:", error);
      toast.error("Erro ao adicionar nota fiscal");
      return null;
    }
  };

  const updateInvoice = async (id: string, invoiceData: Partial<PurchaseInvoice>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .update(invoiceData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setInvoices((prev) =>
        prev.map((invoice) => (invoice.id === id ? { ...invoice, ...invoiceData } : invoice))
      );
      return true;
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Erro ao atualizar nota fiscal");
      return false;
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("purchase_invoices")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Erro ao excluir nota fiscal");
      return false;
    }
  };

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices,
  };
}

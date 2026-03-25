import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface KnowledgeItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_type: "manual" | "file";
  file_url: string | null;
  file_name: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeBase() {
  const { user } = useAuth();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data as KnowledgeItem[] || []);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      toast.error("Erro ao carregar base de conhecimento");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const addManualItem = async (title: string, content: string, tags?: string[]) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          user_id: user.id,
          title,
          content,
          source_type: "manual",
          tags,
        })
        .select()
        .single();

      if (error) throw error;
      
      setItems((prev) => [data as KnowledgeItem, ...prev]);
      toast.success("Conhecimento adicionado com sucesso!");
      return data;
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast.error("Erro ao adicionar conhecimento");
      return null;
    }
  };

  const addFileItem = async (file: File) => {
    if (!user) return null;

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("knowledge-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from("knowledge-docs")
        .getPublicUrl(filePath);

      // For now, store file info - content extraction would require additional processing
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          user_id: user.id,
          title: file.name,
          content: `[Arquivo: ${file.name}] - Conteúdo pendente de extração`,
          source_type: "file",
          file_url: filePath,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) throw error;
      
      setItems((prev) => [data as KnowledgeItem, ...prev]);
      toast.success("Arquivo enviado com sucesso!");
      return data;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<KnowledgeItem>) => {
    try {
      const { error } = await supabase
        .from("knowledge_base")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      toast.success("Atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating knowledge:", error);
      toast.error("Erro ao atualizar");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id);
      
      // Delete file from storage if exists
      if (item?.file_url) {
        await supabase.storage.from("knowledge-docs").remove([item.file_url]);
      }

      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Removido com sucesso!");
    } catch (error) {
      console.error("Error deleting knowledge:", error);
      toast.error("Erro ao remover");
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateItem(id, { is_active: isActive });
  };

  return {
    items,
    isLoading,
    addManualItem,
    addFileItem,
    updateItem,
    deleteItem,
    toggleActive,
    refetch: fetchItems,
  };
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractedItem {
  name: string;
  quantity?: number;
  unit?: string;
  brand?: string;
  price?: number;
  category?: "insumos" | "bebidas" | "embalagens" | "limpeza";
  conversionFactor?: number;
}

type ExtractionType = "shopping_list" | "inventory";

export function useImageExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);

  const extractFromImage = async (
    file: File,
    extractionType: ExtractionType
  ): Promise<ExtractedItem[]> => {
    setIsExtracting(true);
    setExtractedItems([]);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida");
        return [];
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 10MB");
        return [];
      }

      // Convert to base64
      const base64 = await fileToBase64(file);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("extract-from-image", {
        body: { imageBase64: base64, extractionType },
      });

      if (error) {
        console.error("Extraction error:", error);
        toast.error("Erro ao processar imagem. Tente novamente.");
        return [];
      }

      if (data?.error) {
        toast.error(data.error);
        return [];
      }

      const items = data?.items || [];
      setExtractedItems(items);

      if (items.length === 0) {
        toast.warning("Nenhum item encontrado na imagem");
      } else {
        toast.success(`${items.length} item(s) extraído(s) da imagem`);
      }

      return items;
    } catch (err) {
      console.error("Image extraction failed:", err);
      toast.error("Falha ao extrair dados da imagem");
      return [];
    } finally {
      setIsExtracting(false);
    }
  };

  const clearExtracted = () => {
    setExtractedItems([]);
  };

  return {
    isExtracting,
    extractedItems,
    extractFromImage,
    clearExtracted,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

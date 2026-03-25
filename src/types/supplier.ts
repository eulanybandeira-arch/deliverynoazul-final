export interface Supplier {
  id: string;
  name: string;
  category: "Atacadão" | "Distribuidor" | "Feira" | "Açougue" | "Outros";
  defaultLeadTime: number;
  contact: string;
  email?: string;
  notes?: string;
}

export const SUPPLIER_CATEGORIES = ["Atacadão", "Distribuidor", "Feira", "Açougue", "Outros"] as const;
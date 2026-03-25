export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;

  // Unidades
  purchase_unit: string;
  stock_unit: string;
  conversion_factor: number;
  cost_per_stock_unit: number;

  // Categorias
  category_logistics: string;
  category_culinary?: string;

  // Valores
  unit_cost: number; // Custo unitário da compra
  total_cost: number; // Calculado: quantity_purchased * unit_cost
  quantity_purchased: number;
  current_stock: number;
  min_alert_level: number;
  min_alert_unit: string; // Unidade do nível mínimo (pode ser U.C. ou U.E.)
  
  purchase_date?: string;
  expiry_date?: string;
  purchase_note_id?: string; // Campo para associar a nota
  created_at: string;
  updated_at: string;
  loss?: number;
  
  // Campos específicos para embalagens/utensílios
  package_capacity?: string; 
  utensil_type?: string;

  // Histórico (simplificado)
  initial_stock?: number;
  total_purchased?: number;
  total_used?: number;
}

// Opções para Unidade de Compra (U.C.)
export const PURCHASE_UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "L" },
  { value: "ml", label: "ml" },
  { value: "pacote", label: "Pacote" },
  { value: "caixa", label: "Caixa" },
  { value: "unidade", label: "Unidade" },
  { value: "fardo", label: "Fardo" },
  { value: "pote", label: "Pote" },
  { value: "sache", label: "Sachê" },
  { value: "folha", label: "Folha" },
];

// Opções para Unidade de Estoque/Uso (U.E.)
export const STOCK_UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "L" },
  { value: "ml", label: "ml" },
  { value: "unidade", label: "un" },
];

// Opções para Categoria de Logística (Apenas Insumos Culinários)
export const LOGISTICS_CATEGORY_OPTIONS = [
  { value: "pereciveis", label: "Perecíveis" },
  { value: "nao_pereciveis", label: "Não Perecíveis" },
  { value: "congelados", label: "Congelados" },
  { value: "outros", label: "Outros" },
];

// Opções para Categoria Culinária (Opcional)
export const CULINARY_CATEGORY_OPTIONS = [
  { value: "proteinas", label: "Proteínas" },
  { value: "laticinios", label: "Laticínios" },
  { value: "hortifruti", label: "Hortifrúti" },
  { value: "graos_cereais", label: "Grãos e Cereais" },
  { value: "gorduras_oleos", label: "Gorduras e Óleos" },
  { value: "temperos_especiarias", label: "Temperos e Especiarias" },
  { value: "molhos_condimentos", label: "Molhos e Condimentos" },
  { value: "secos", label: "Secos" },
  { value: "nao_aplicavel", label: "Não Aplicável" },
];

// Opções para Tipo de Utensílio/Embalagem
export const UTENSIL_TYPE_OPTIONS = [
  { value: "pote", label: "Pote" },
  { value: "marmita", label: "Marmita" },
  { value: "saco", label: "Saco / Sacola" },
  { value: "kit_delivery", label: "Kit Delivery" },
  { value: "talheres", label: "Talheres (Garfo, Faca, Colher)" },
  { value: "guardanapos", label: "Guardanapos" },
  { value: "copos", label: "Copos" },
  { value: "outros", label: "Outro Tipo" },
];
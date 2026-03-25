export interface Ingredient {
  id: string;
  name: string;
  packageQty: number;
  unit: string;
  unitFactor?: number; // Fator de conversão da unidade (ex.: kg=1000 g)
  customUnitLabel?: string; // Rótulo quando unidade personalizada
  unitPrice: number;
  usedQty: number;
  usedUnit?: string; // Unidade da quantidade utilizada (pode diferir da unidade do pacote)
  usedValue: number;
  loss?: number; // Percentual de perda (0-100)
  inventoryItemId?: string; // NEW: Link to InventoryItem
}

export interface Expense {
  name: string;
  value: number;
  dueDate: string;
  attachmentUrl?: string;
  lastPaid?: string; // Formato YYYY-MM
}

export interface Packaging {
  id: string;
  name: string;
  packageQty: number;
  unit: string;
  unitFactor?: number; // Fator de conversão da unidade
  customUnitLabel?: string; // Rótulo quando unidade personalizada
  packagePrice: number;
  usedQty: number;
  usedUnit?: string; // Unidade da quantidade utilizada
  usedValue: number;
  inventoryItemId?: string; // NEW: Link to InventoryItem
}

export interface Recipe {
  id: string;
  name: string;
  yield: number;
  ingredients: Ingredient[];
  packaging: Packaging[];
  profitMargin: number;
  fixedCostProportion?: number; // Proporção de Custo Fixo (%)
  appFee: number;
  cardFee: number;
  taxFee: number;
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface BusinessIdentity {
  id?: string;
  type: 'cnpj' | 'cpf' | 'estrangeiro';
  razaoSocial?: string;
  nomeCompleto?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  dadosConfirmados?: boolean; // Flag de confirmação de dados legais
}

export interface BusinessMetrics {
  monthlyRevenue: number;
  workDays: number;
  workDaysPerWeek: number;
  dailyTarget: number;
  minProfitMargin: number;
}

export interface SalesChannel { // NEW: Define SalesChannel interface
  id: string;
  name: string;
  platformFee: number;
  paymentFee: number;
  cardFee: number;
  anticipationFee: number;
  applyAnticipation: boolean;
  monthlyFee: number; // NEW: Monthly fixed fee
}

export const UNIT_OPTIONS = [
  { value: "kg", label: "kg", factor: 1000 },
  { value: "g", label: "g", factor: 1 },
  { value: "L", label: "L", factor: 1000 },
  { value: "mL", label: "mL", factor: 1 },
  { value: "unidade", label: "un", factor: 1 },
  { value: "pacote", label: "pacote", factor: 1 },
  { value: "gotas", label: "gotas", factor: 1 },
  { value: "colher_sopa", label: "colher de sopa", factor: 1 },
  { value: "colher_cha", label: "colher de chá", factor: 1 },
  { value: "xicara_1_4", label: "1/4 xícara", factor: 0.25 },
  { value: "xicara_1_3", label: "1/3 xícara", factor: 0.33 },
  { value: "xicara_1_2", label: "1/2 xícara", factor: 0.5 },
  { value: "xicara_2_3", label: "2/3 xícara", factor: 0.67 },
  { value: "xicara_3_4", label: "3/4 xícara", factor: 0.75 },
  { value: "xicara", label: "1 xícara", factor: 1 },
  { value: "custom", label: "personalizada", factor: 1 },
];
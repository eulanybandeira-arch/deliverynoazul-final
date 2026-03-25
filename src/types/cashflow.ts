export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  value: number;
  type: 'entrada' | 'saída';
  category: string;
  status: 'efetuado' | 'agendado' | 'vencido';
  location: 'conta_corrente' | 'pix' | 'dinheiro_fisico';
  import_id?: string;
  recipe_id?: string;
  quantity_sold?: number;
}

export const INCOME_CATEGORIES = [
  { value: "venda", label: "Venda" },
  { value: "estorno", label: "Estorno" },
  { value: "outras_receitas", label: "Outras Receitas" },
];

export const EXPENSE_CATEGORIES = [
  { value: "insumos", label: "Insumos" },
  { value: "custos", label: "Custos" },
  { value: "despesas", label: "Despesas" },
  { value: "despesas_fixas", label: "Despesas Fixas" },
  { value: "imposto", label: "Imposto" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "manutencao", label: "Manutenção" },
  { value: "comissao_plataforma", label: "Comissão Plataforma" },
  { value: "outros", label: "Outros" },
];

export const STATUS_OPTIONS = [
  { value: "efetuado", label: "Efetuado" },
  { value: "agendado", label: "A Pagar/Agendado" },
  { value: "vencido", label: "Vencido" },
];

export const LOCATION_OPTIONS = [
  { value: "conta_corrente", label: "Conta Corrente" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro_fisico", label: "Dinheiro Físico" },
];
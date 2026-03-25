export interface PrepBase {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  photo_url: string | null;
  shelf_life_days: number | null;
  yield_amount: number;
  yield_unit: string;
  total_cost: number | null;
  unit_cost: number | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrepBaseIngredient {
  id: string;
  prep_base_id: string;
  name: string;
  inventory_item_id: string | null;
  used_qty: number;
  used_unit: string | null;
  unit: string;
  package_qty: number;
  unit_price: number;
  loss: number | null;
  created_at: string | null;
}

export interface PrepBaseLabel {
  id: string;
  prep_base_id: string;
  user_id: string;
  responsible: string;
  quantity_produced: number;
  production_unit: string;
  production_date: string;
  expiry_date: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export const PREP_BASE_CATEGORIES = [
  "Molho",
  "Massa",
  "Recheio",
  "Cobertura",
  "Calda",
  "Creme",
  "Tempero",
  "Marinada",
  "Base",
  "Outro",
];

export const PREP_BASE_UNITS = ["Kg", "g", "L", "mL", "unidade"];

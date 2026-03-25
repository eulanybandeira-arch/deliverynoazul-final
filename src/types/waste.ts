export interface WasteReason {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WasteEntry {
  id: string;
  user_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  reason_id: string | null;
  reason_text: string | null;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

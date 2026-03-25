export interface BeverageItem {
  id: string;
  user_id?: string;
  name: string;
  brand?: string;
  purchase_unit: string;
  unit_cost: number;
  quantity_purchased: number;
  current_stock: number;
  min_alert_level: number;
  total_cost: number;
  purchase_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

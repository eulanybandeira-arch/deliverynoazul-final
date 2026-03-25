export interface EquipmentItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_value: number;
  current_value: number;
  warranty_end?: string;
  maintenance_interval?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  status: string;
  notes?: string;
  invoice_url?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

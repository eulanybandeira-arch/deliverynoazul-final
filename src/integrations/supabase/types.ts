export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      beverages: {
        Row: {
          brand: string | null
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          min_alert_level: number
          name: string
          purchase_date: string | null
          purchase_unit: string
          quantity_purchased: number
          total_cost: number
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          min_alert_level?: number
          name: string
          purchase_date?: string | null
          purchase_unit?: string
          quantity_purchased?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          min_alert_level?: number
          name?: string
          purchase_date?: string | null
          purchase_unit?: string
          quantity_purchased?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_identity: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string | null
          dados_confirmados: boolean | null
          documento: string | null
          email: string | null
          estado: string | null
          id: string
          logo_url: string | null
          logradouro: string | null
          name: string
          nome_completo: string | null
          numero: string | null
          razao_social: string | null
          telefone: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string | null
          dados_confirmados?: boolean | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          name: string
          nome_completo?: string | null
          numero?: string | null
          razao_social?: string | null
          telefone?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string | null
          dados_confirmados?: boolean | null
          documento?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          logradouro?: string | null
          name?: string
          nome_completo?: string | null
          numero?: string | null
          razao_social?: string | null
          telefone?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_metrics: {
        Row: {
          created_at: string | null
          daily_target: number | null
          id: string
          min_profit_margin: number | null
          monthly_revenue: number | null
          updated_at: string | null
          user_id: string
          work_days: number | null
          work_days_per_week: number | null
        }
        Insert: {
          created_at?: string | null
          daily_target?: number | null
          id?: string
          min_profit_margin?: number | null
          monthly_revenue?: number | null
          updated_at?: string | null
          user_id: string
          work_days?: number | null
          work_days_per_week?: number | null
        }
        Update: {
          created_at?: string | null
          daily_target?: number | null
          id?: string
          min_profit_margin?: number | null
          monthly_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          work_days?: number | null
          work_days_per_week?: number | null
        }
        Relationships: []
      }
      cash_flow_entries: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string
          id: string
          import_id: string | null
          location: string
          quantity_sold: number | null
          recipe_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          import_id?: string | null
          location: string
          quantity_sold?: number | null
          recipe_id?: string | null
          status: string
          type: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          import_id?: string | null
          location?: string
          quantity_sold?: number | null
          recipe_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      cleaning_products: {
        Row: {
          brand: string | null
          created_at: string
          current_stock: number
          id: string
          min_alert_level: number
          name: string
          purchase_date: string | null
          purchase_unit: string
          quantity_purchased: number
          total_cost: number
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          min_alert_level?: number
          name: string
          purchase_date?: string | null
          purchase_unit?: string
          quantity_purchased?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          min_alert_level?: number
          name?: string
          purchase_date?: string | null
          purchase_unit?: string
          quantity_purchased?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment_items: {
        Row: {
          brand: string | null
          created_at: string
          current_value: number | null
          id: string
          last_maintenance: string | null
          maintenance_interval: number | null
          model: string | null
          name: string
          next_maintenance: string | null
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          user_id: string
          warranty_end: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          last_maintenance?: string | null
          maintenance_interval?: number | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          warranty_end?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          current_value?: number | null
          id?: string
          last_maintenance?: string | null
          maintenance_interval?: number | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          warranty_end?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          name: string
          recipe_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          name: string
          recipe_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          name?: string
          recipe_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          loss: number | null
          name: string
          package_qty: number
          recipe_id: string
          unit: string
          unit_price: number
          used_qty: number
          used_unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          loss?: number | null
          name: string
          package_qty: number
          recipe_id: string
          unit: string
          unit_price: number
          used_qty: number
          used_unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          loss?: number | null
          name?: string
          package_qty?: number
          recipe_id?: string
          unit?: string
          unit_price?: number
          used_qty?: number
          used_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_entries: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          inventory_item_id: string
          purchase_date: string
          quantity: number
          supplier: string | null
          total_cost: number
          unit_cost: number
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          inventory_item_id: string
          purchase_date?: string
          quantity?: number
          supplier?: string | null
          total_cost?: number
          unit_cost?: number
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string
          purchase_date?: string
          quantity?: number
          supplier?: string | null
          total_cost?: number
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_entries_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          brand: string | null
          category_culinary: string | null
          category_logistics: string | null
          conversion_factor: number | null
          cost_per_stock_unit: number | null
          created_at: string
          current_stock: number
          expiry_date: string | null
          id: string
          initial_stock: number | null
          loss: number | null
          min_alert_level: number
          min_alert_unit: string | null
          name: string
          package_capacity: string | null
          purchase_date: string | null
          purchase_note_link: string | null
          purchase_note_url: string | null
          purchase_unit: string | null
          quantity_purchased: number
          stock_unit: string | null
          total_cost: number
          total_purchased: number | null
          total_used: number | null
          unit: string
          unit_cost: number | null
          updated_at: string
          user_id: string
          utensil_type: string | null
        }
        Insert: {
          brand?: string | null
          category_culinary?: string | null
          category_logistics?: string | null
          conversion_factor?: number | null
          cost_per_stock_unit?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          initial_stock?: number | null
          loss?: number | null
          min_alert_level?: number
          min_alert_unit?: string | null
          name: string
          package_capacity?: string | null
          purchase_date?: string | null
          purchase_note_link?: string | null
          purchase_note_url?: string | null
          purchase_unit?: string | null
          quantity_purchased?: number
          stock_unit?: string | null
          total_cost?: number
          total_purchased?: number | null
          total_used?: number | null
          unit: string
          unit_cost?: number | null
          updated_at?: string
          user_id: string
          utensil_type?: string | null
        }
        Update: {
          brand?: string | null
          category_culinary?: string | null
          category_logistics?: string | null
          conversion_factor?: number | null
          cost_per_stock_unit?: number | null
          created_at?: string
          current_stock?: number
          expiry_date?: string | null
          id?: string
          initial_stock?: number | null
          loss?: number | null
          min_alert_level?: number
          min_alert_unit?: string | null
          name?: string
          package_capacity?: string | null
          purchase_date?: string | null
          purchase_note_link?: string | null
          purchase_note_url?: string | null
          purchase_unit?: string | null
          quantity_purchased?: number
          stock_unit?: string | null
          total_cost?: number
          total_purchased?: number | null
          total_used?: number | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
          utensil_type?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_active: boolean
          source_type: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_link: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_link?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_link?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      packaging: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          name: string
          package_price: number
          package_qty: number
          recipe_id: string
          unit: string
          used_qty: number
          used_unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          name: string
          package_price: number
          package_qty: number
          recipe_id: string
          unit: string
          used_qty: number
          used_unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          name?: string
          package_price?: number
          package_qty?: number
          recipe_id?: string
          unit?: string
          used_qty?: number
          used_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packaging_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_base_ingredients: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          loss: number | null
          name: string
          package_qty: number
          prep_base_id: string
          unit: string
          unit_price: number
          used_qty: number
          used_unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          loss?: number | null
          name: string
          package_qty: number
          prep_base_id: string
          unit: string
          unit_price: number
          used_qty: number
          used_unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          loss?: number | null
          name?: string
          package_qty?: number
          prep_base_id?: string
          unit?: string
          unit_price?: number
          used_qty?: number
          used_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prep_base_ingredients_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prep_base_ingredients_prep_base_id_fkey"
            columns: ["prep_base_id"]
            isOneToOne: false
            referencedRelation: "prep_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_base_labels: {
        Row: {
          code: string
          created_at: string
          expiry_date: string
          id: string
          prep_base_id: string
          production_date: string
          production_unit: string
          quantity_produced: number
          responsible: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          expiry_date?: string
          id?: string
          prep_base_id: string
          production_date?: string
          production_unit?: string
          quantity_produced?: number
          responsible: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expiry_date?: string
          id?: string
          prep_base_id?: string
          production_date?: string
          production_unit?: string
          quantity_produced?: number
          responsible?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prep_base_labels_prep_base_id_fkey"
            columns: ["prep_base_id"]
            isOneToOne: false
            referencedRelation: "prep_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      prep_bases: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          name: string
          photo_url: string | null
          shelf_life_days: number | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string
          user_id: string
          yield_amount: number
          yield_unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name: string
          photo_url?: string | null
          shelf_life_days?: number | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
          user_id: string
          yield_amount?: number
          yield_unit?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string
          photo_url?: string | null
          shelf_life_days?: number | null
          total_cost?: number | null
          unit_cost?: number | null
          updated_at?: string
          user_id?: string
          yield_amount?: number
          yield_unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_invoices: {
        Row: {
          created_at: string
          date: string
          description: string
          file_url: string | null
          id: string
          link: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          file_url?: string | null
          id?: string
          link?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          file_url?: string | null
          id?: string
          link?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_channel_pricing: {
        Row: {
          channel_id: string
          created_at: string
          final_price: number | null
          id: string
          is_active: boolean
          recipe_id: string
          target_margin: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          recipe_id: string
          target_margin?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          final_price?: number | null
          id?: string
          is_active?: boolean
          recipe_id?: string
          target_margin?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_channel_pricing_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_channel_pricing_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          app_fee: number | null
          card_fee: number | null
          category: string | null
          created_at: string | null
          fill_date: string | null
          id: string
          name: string
          profit_margin: number | null
          status: string | null
          suggested_price: number | null
          tags: string[] | null
          tax_fee: number | null
          updated_at: string | null
          user_id: string
          yield: number
        }
        Insert: {
          app_fee?: number | null
          card_fee?: number | null
          category?: string | null
          created_at?: string | null
          fill_date?: string | null
          id?: string
          name: string
          profit_margin?: number | null
          status?: string | null
          suggested_price?: number | null
          tags?: string[] | null
          tax_fee?: number | null
          updated_at?: string | null
          user_id: string
          yield?: number
        }
        Update: {
          app_fee?: number | null
          card_fee?: number | null
          category?: string | null
          created_at?: string | null
          fill_date?: string | null
          id?: string
          name?: string
          profit_margin?: number | null
          status?: string | null
          suggested_price?: number | null
          tags?: string[] | null
          tax_fee?: number | null
          updated_at?: string | null
          user_id?: string
          yield?: number
        }
        Relationships: []
      }
      sales_channels: {
        Row: {
          anticipation_fee: number | null
          apply_anticipation: boolean | null
          card_fee: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number | null
          name: string
          payment_fee: number | null
          platform_fee: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anticipation_fee?: number | null
          apply_anticipation?: boolean | null
          card_fee?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          name: string
          payment_fee?: number | null
          platform_fee?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anticipation_fee?: number | null
          apply_anticipation?: boolean | null
          card_fee?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          name?: string
          payment_fee?: number | null
          platform_fee?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          cash_flow_entry_id: string | null
          created_at: string
          id: string
          inventory_item_id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity: number
          recipe_id: string | null
          recipe_name: string | null
          user_id: string
        }
        Insert: {
          cash_flow_entry_id?: string | null
          created_at?: string
          id?: string
          inventory_item_id: string
          movement_type: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          quantity: number
          recipe_id?: string | null
          recipe_name?: string | null
          user_id: string
        }
        Update: {
          cash_flow_entry_id?: string | null
          created_at?: string
          id?: string
          inventory_item_id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity?: number
          recipe_id?: string | null
          recipe_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_cash_flow_entry_id_fkey"
            columns: ["cash_flow_entry_id"]
            isOneToOne: false
            referencedRelation: "cash_flow_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          kiwify_transaction_id: string | null
          plan: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          kiwify_transaction_id?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          kiwify_transaction_id?: string | null
          plan?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waste_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          reason_id: string | null
          reason_text: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          reason_id?: string | null
          reason_text?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          reason_id?: string | null
          reason_text?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_entries_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_entries_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "waste_reasons"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_reasons: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_knowledge_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

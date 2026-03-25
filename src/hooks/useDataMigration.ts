import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface MigrationResult {
  beverages: { migrated: number; skipped: number };
  cleaning: { migrated: number; skipped: number };
  invoices: { migrated: number; skipped: number };
  recipes: { migrated: number; skipped: number };
  equipment: { migrated: number; skipped: number };
  salesChannels: { migrated: number; skipped: number };
}

// Keys that might have been used in localStorage
const BEVERAGE_KEYS = ['beverageItems', 'beverages', 'beverage_items'];
const CLEANING_KEYS = ['cleaningItems', 'cleaning_products', 'cleaningProducts'];
const INVOICE_KEYS = ['purchaseInvoices', 'purchase_invoices', 'invoices'];
const INVENTORY_KEYS = ['inventoryItems', 'inventory_items', 'inventory'];
const RECIPE_KEYS = ['recipes'];
const CASHFLOW_KEYS = ['cashFlowEntries', 'cash_flow_entries'];
const SALES_CHANNEL_KEYS = ['salesChannels', 'sales_channels'];
const EXPENSE_KEYS = ['expenses'];
const EQUIPMENT_KEYS = ['equipmentItems', 'equipment_items'];

function findLocalStorageData<T>(keys: string[]): T[] {
  for (const key of keys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Found data in localStorage key: ${key}`, parsed.length, 'items');
          return parsed;
        }
      } catch (e) {
        console.error(`Error parsing localStorage key ${key}:`, e);
      }
    }
  }
  return [];
}

export function useDataMigration() {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const migrateData = async (): Promise<MigrationResult | null> => {
    if (!user) {
      toast.error("Você precisa estar logado para migrar dados");
      return null;
    }

    setMigrating(true);
    const migrationResult: MigrationResult = {
      beverages: { migrated: 0, skipped: 0 },
      cleaning: { migrated: 0, skipped: 0 },
      invoices: { migrated: 0, skipped: 0 },
      recipes: { migrated: 0, skipped: 0 },
      equipment: { migrated: 0, skipped: 0 },
      salesChannels: { migrated: 0, skipped: 0 },
    };

    try {
      // Migrate Beverages
      const beverages = findLocalStorageData<any>(BEVERAGE_KEYS);
      console.log('Beverages to migrate:', beverages);
      
      for (const item of beverages) {
        try {
          const { error } = await supabase.from('beverages').insert({
            user_id: user.id,
            name: item.name || item.nome || 'Sem nome',
            brand: item.brand || item.marca || null,
            purchase_unit: item.purchase_unit || item.purchaseUnit || item.unidade || 'unidade',
            unit_cost: Number(item.unit_cost || item.unitCost || item.custo_unitario || 0),
            quantity_purchased: Number(item.quantity_purchased || item.quantityPurchased || item.quantidade || 0),
            current_stock: Number(item.current_stock || item.currentStock || item.estoque || item.quantity_purchased || 0),
            min_alert_level: Number(item.min_alert_level || item.minAlertLevel || item.nivel_minimo || 0),
            total_cost: Number(item.total_cost || item.totalCost || item.custo_total || 0),
            purchase_date: item.purchase_date || item.purchaseDate || item.data_compra || null,
            expiry_date: item.expiry_date || item.expiryDate || item.validade || null,
          });

          if (error) {
            console.error('Error migrating beverage:', error);
            migrationResult.beverages.skipped++;
          } else {
            migrationResult.beverages.migrated++;
          }
        } catch (e) {
          console.error('Error processing beverage item:', e);
          migrationResult.beverages.skipped++;
        }
      }

      // Migrate Cleaning Products
      const cleaningProducts = findLocalStorageData<any>(CLEANING_KEYS);
      console.log('Cleaning products to migrate:', cleaningProducts);
      
      for (const item of cleaningProducts) {
        try {
          const { error } = await supabase.from('cleaning_products').insert({
            user_id: user.id,
            name: item.name || item.nome || 'Sem nome',
            brand: item.brand || item.marca || null,
            purchase_unit: item.purchase_unit || item.purchaseUnit || item.unidade || 'unidade',
            unit_cost: Number(item.unit_cost || item.unitCost || item.custo_unitario || 0),
            quantity_purchased: Number(item.quantity_purchased || item.quantityPurchased || item.quantidade || 0),
            current_stock: Number(item.current_stock || item.currentStock || item.estoque || item.quantity_purchased || 0),
            min_alert_level: Number(item.min_alert_level || item.minAlertLevel || item.nivel_minimo || 0),
            total_cost: Number(item.total_cost || item.totalCost || item.custo_total || 0),
            purchase_date: item.purchase_date || item.purchaseDate || item.data_compra || null,
          });

          if (error) {
            console.error('Error migrating cleaning product:', error);
            migrationResult.cleaning.skipped++;
          } else {
            migrationResult.cleaning.migrated++;
          }
        } catch (e) {
          console.error('Error processing cleaning item:', e);
          migrationResult.cleaning.skipped++;
        }
      }

      // Migrate Invoices
      const invoices = findLocalStorageData<any>(INVOICE_KEYS);
      console.log('Invoices to migrate:', invoices);
      
      for (const item of invoices) {
        try {
          const { error } = await supabase.from('purchase_invoices').insert({
            user_id: user.id,
            description: item.description || item.descricao || 'Sem descrição',
            date: item.date || item.data || new Date().toISOString().split('T')[0],
            file_url: item.file_url || item.fileUrl || item.arquivo || null,
            link: item.link || null,
          });

          if (error) {
            console.error('Error migrating invoice:', error);
            migrationResult.invoices.skipped++;
          } else {
            migrationResult.invoices.migrated++;
          }
        } catch (e) {
          console.error('Error processing invoice item:', e);
          migrationResult.invoices.skipped++;
        }
      }

      // Migrate Recipes
      const recipes = findLocalStorageData<any>(RECIPE_KEYS);
      console.log('Recipes to migrate:', recipes);
      
      for (const item of recipes) {
        try {
          const { data: recipeData, error: recipeError } = await supabase.from('recipes').insert({
            user_id: user.id,
            name: item.name || item.nome || 'Sem nome',
            yield: Number(item.yield || item.rendimento || 1),
            profit_margin: Number(item.profit_margin || item.profitMargin || item.margem || 70),
            app_fee: Number(item.app_fee || item.appFee || 0),
            card_fee: Number(item.card_fee || item.cardFee || 0),
            tax_fee: Number(item.tax_fee || item.taxFee || 0),
            suggested_price: item.suggested_price || item.suggestedPrice || null,
            category: item.category || item.categoria || null,
            tags: item.tags || null,
          }).select().single();

          if (recipeError) {
            console.error('Error migrating recipe:', recipeError);
            migrationResult.recipes.skipped++;
          } else {
            migrationResult.recipes.migrated++;
            
            // Migrate recipe ingredients
            const ingredients = item.ingredients || item.ingredientes || [];
            for (const ing of ingredients) {
              await supabase.from('ingredients').insert({
                recipe_id: recipeData.id,
                name: ing.name || ing.nome || 'Ingrediente',
                unit: ing.unit || ing.unidade || 'unidade',
                package_qty: Number(ing.package_qty || ing.packageQty || ing.qtdEmbalagem || 1),
                unit_price: Number(ing.unit_price || ing.unitPrice || ing.precoUnitario || 0),
                used_qty: Number(ing.used_qty || ing.usedQty || ing.qtdUsada || 0),
                loss: Number(ing.loss || ing.perda || 0),
              });
            }
            
            // Migrate recipe packaging
            const packaging = item.packaging || item.embalagens || [];
            for (const pkg of packaging) {
              await supabase.from('packaging').insert({
                recipe_id: recipeData.id,
                name: pkg.name || pkg.nome || 'Embalagem',
                unit: pkg.unit || pkg.unidade || 'unidade',
                package_qty: Number(pkg.package_qty || pkg.packageQty || pkg.qtdEmbalagem || 1),
                package_price: Number(pkg.package_price || pkg.packagePrice || pkg.precoEmbalagem || 0),
                used_qty: Number(pkg.used_qty || pkg.usedQty || pkg.qtdUsada || 0),
              });
            }
            
            // Migrate recipe expenses
            const expenses = item.expenses || item.despesas || [];
            for (const exp of expenses) {
              await supabase.from('expenses').insert({
                recipe_id: recipeData.id,
                name: exp.name || exp.nome || 'Despesa',
                value: Number(exp.value || exp.valor || 0),
                due_date: exp.due_date || exp.dueDate || null,
              });
            }
          }
        } catch (e) {
          console.error('Error processing recipe item:', e);
          migrationResult.recipes.skipped++;
        }
      }

      // Migrate Equipment
      const equipment = findLocalStorageData<any>(EQUIPMENT_KEYS);
      console.log('Equipment to migrate:', equipment);
      
      for (const item of equipment) {
        try {
          const { error } = await supabase.from('equipment_items').insert({
            user_id: user.id,
            name: item.name || item.nome || 'Sem nome',
            brand: item.brand || item.marca || null,
            model: item.model || item.modelo || null,
            serial_number: item.serial_number || item.serialNumber || null,
            purchase_date: item.purchase_date || item.purchaseDate || null,
            purchase_value: Number(item.purchase_value || item.purchaseValue || 0),
            current_value: Number(item.current_value || item.currentValue || 0),
            warranty_end: item.warranty_end || item.warrantyEnd || null,
            maintenance_interval: item.maintenance_interval || item.maintenanceInterval || null,
            last_maintenance: item.last_maintenance || item.lastMaintenance || null,
            next_maintenance: item.next_maintenance || item.nextMaintenance || null,
            status: item.status || 'ativo',
            notes: item.notes || item.notas || null,
          });

          if (error) {
            console.error('Error migrating equipment:', error);
            migrationResult.equipment.skipped++;
          } else {
            migrationResult.equipment.migrated++;
          }
        } catch (e) {
          console.error('Error processing equipment item:', e);
          migrationResult.equipment.skipped++;
        }
      }

      // Migrate Sales Channels
      const salesChannels = findLocalStorageData<any>(SALES_CHANNEL_KEYS);
      console.log('Sales channels to migrate:', salesChannels);
      
      for (const item of salesChannels) {
        try {
          const { error } = await supabase.from('sales_channels').insert({
            user_id: user.id,
            name: item.name || item.nome || 'Canal',
            platform_fee: Number(item.platform_fee || item.platformFee || 0),
            payment_fee: Number(item.payment_fee || item.paymentFee || 0),
            anticipation_fee: Number(item.anticipation_fee || item.anticipationFee || 0),
            apply_anticipation: item.apply_anticipation || item.applyAnticipation || false,
            is_active: item.is_active !== undefined ? item.is_active : true,
          });

          if (error) {
            console.error('Error migrating sales channel:', error);
            migrationResult.salesChannels.skipped++;
          } else {
            migrationResult.salesChannels.migrated++;
          }
        } catch (e) {
          console.error('Error processing sales channel item:', e);
          migrationResult.salesChannels.skipped++;
        }
      }

      setResult(migrationResult);

      const totalMigrated = 
        migrationResult.beverages.migrated + 
        migrationResult.cleaning.migrated + 
        migrationResult.invoices.migrated +
        migrationResult.recipes.migrated +
        migrationResult.equipment.migrated +
        migrationResult.salesChannels.migrated;

      if (totalMigrated > 0) {
        toast.success(`Migração concluída! ${totalMigrated} itens migrados.`);
      } else {
        toast.info("Nenhum dado encontrado no localStorage para migrar.");
      }

      return migrationResult;
    } catch (error) {
      console.error('Migration error:', error);
      toast.error("Erro durante a migração");
      return null;
    } finally {
      setMigrating(false);
    }
  };

  const clearLocalStorageData = () => {
    const allKeys = [
      ...BEVERAGE_KEYS, 
      ...CLEANING_KEYS, 
      ...INVOICE_KEYS,
      ...INVENTORY_KEYS,
      ...RECIPE_KEYS,
      ...CASHFLOW_KEYS,
      ...SALES_CHANNEL_KEYS,
      ...EXPENSE_KEYS,
      ...EQUIPMENT_KEYS,
    ];
    allKeys.forEach(key => localStorage.removeItem(key));
    toast.success("Dados antigos do localStorage removidos.");
  };

  const checkLocalStorageData = () => {
    const beverages = findLocalStorageData<any>(BEVERAGE_KEYS);
    const cleaning = findLocalStorageData<any>(CLEANING_KEYS);
    const invoices = findLocalStorageData<any>(INVOICE_KEYS);
    const inventory = findLocalStorageData<any>(INVENTORY_KEYS);
    const recipes = findLocalStorageData<any>(RECIPE_KEYS);
    const cashFlow = findLocalStorageData<any>(CASHFLOW_KEYS);
    const salesChannels = findLocalStorageData<any>(SALES_CHANNEL_KEYS);
    const expenses = findLocalStorageData<any>(EXPENSE_KEYS);
    const equipment = findLocalStorageData<any>(EQUIPMENT_KEYS);

    const total = beverages.length + cleaning.length + invoices.length + 
                  inventory.length + recipes.length + cashFlow.length + 
                  salesChannels.length + expenses.length + equipment.length;

    return {
      beverages: beverages.length,
      cleaning: cleaning.length,
      invoices: invoices.length,
      inventory: inventory.length,
      recipes: recipes.length,
      cashFlow: cashFlow.length,
      salesChannels: salesChannels.length,
      expenses: expenses.length,
      equipment: equipment.length,
      total,
    };
  };

  return {
    migrateData,
    clearLocalStorageData,
    checkLocalStorageData,
    migrating,
    result,
  };
}

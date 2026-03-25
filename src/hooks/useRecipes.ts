import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Recipe, Ingredient, Packaging, Expense } from "@/types/pricing";
import { calculateIngredientValue, calculatePackagingValue } from "@/utils/pricing";

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (recipesError) throw recipesError;

      // Fetch ingredients and packaging for each recipe
      const recipesWithDetails = await Promise.all(
        (recipesData || []).map(async (recipe) => {
          const [ingredientsRes, packagingRes, expensesRes] = await Promise.all([
            supabase.from("ingredients").select("*").eq("recipe_id", recipe.id),
            supabase.from("packaging").select("*").eq("recipe_id", recipe.id),
            supabase.from("expenses").select("*").eq("recipe_id", recipe.id),
          ]);

          const ingredients: Ingredient[] = (ingredientsRes.data || []).map((ing) => {
            const unit = ing.unit;
            const usedUnit = (ing as { used_unit?: string }).used_unit || unit;

            const mapped: Ingredient = {
              id: ing.id,
              name: ing.name,
              packageQty: ing.package_qty,
              unit,
              unitPrice: ing.unit_price,
              usedQty: ing.used_qty,
              usedUnit,
              usedValue: 0,
              loss: ing.loss || 0,
              inventoryItemId: ing.inventory_item_id || undefined,
            };

            return { ...mapped, usedValue: calculateIngredientValue(mapped) };
          });

          const packaging: Packaging[] = (packagingRes.data || []).map((pkg) => {
            const unit = pkg.unit;
            const usedUnit = (pkg as { used_unit?: string }).used_unit || unit;

            const mapped: Packaging = {
              id: pkg.id,
              name: pkg.name,
              packageQty: pkg.package_qty,
              unit,
              packagePrice: pkg.package_price,
              usedQty: pkg.used_qty,
              usedUnit,
              usedValue: 0,
              inventoryItemId: pkg.inventory_item_id || undefined,
            };

            return { ...mapped, usedValue: calculatePackagingValue(mapped) };
          });

          return {
            id: recipe.id,
            name: recipe.name,
            yield: recipe.yield,
            ingredients,
            packaging,
            profitMargin: recipe.profit_margin || 0,
            appFee: recipe.app_fee || 0,
            cardFee: recipe.card_fee || 0,
            taxFee: recipe.tax_fee || 0,
            tags: recipe.tags || [],
            category: recipe.category || undefined,
            status: 'published' as const,
            createdAt: recipe.created_at || new Date().toISOString(),
            updatedAt: recipe.updated_at || new Date().toISOString(),
          };
        })
      );

      setRecipes(recipesWithDetails);
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
      toast.error("Erro ao carregar receitas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const saveRecipe = async (recipe: Recipe, status: 'draft' | 'published' = 'published') => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return null;
    }

    try {
      const isNew = !recipes.some(r => r.id === recipe.id);
      
      // Save recipe
      const recipeData = {
        name: recipe.name,
        yield: recipe.yield,
        profit_margin: recipe.profitMargin,
        app_fee: recipe.appFee,
        card_fee: recipe.cardFee,
        tax_fee: recipe.taxFee,
        tags: recipe.tags || [],
        category: recipe.category,
        user_id: user.id,
      };

      let savedRecipe;
      if (isNew) {
        const { data, error } = await supabase
          .from("recipes")
          .insert(recipeData)
          .select()
          .single();
        if (error) throw error;
        savedRecipe = data;
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipe.id)
          .select()
          .single();
        if (error) throw error;
        savedRecipe = data;
      }

      // Delete old ingredients and packaging
      await supabase.from("ingredients").delete().eq("recipe_id", savedRecipe.id);
      await supabase.from("packaging").delete().eq("recipe_id", savedRecipe.id);

      // Insert new ingredients
      if (recipe.ingredients.length > 0) {
        const ingredientsData = recipe.ingredients.map((ing) => ({
          recipe_id: savedRecipe.id,
          name: ing.name,
          package_qty: ing.packageQty,
          unit: ing.unit,
          unit_price: ing.unitPrice,
          used_qty: ing.usedQty,
          used_unit: ing.usedUnit || ing.unit, // Salva usedUnit
          loss: ing.loss || 0,
          inventory_item_id: ing.inventoryItemId || null,
        }));
        
        const { error } = await supabase.from("ingredients").insert(ingredientsData);
        if (error) throw error;
      }

      // Insert new packaging
      if (recipe.packaging.length > 0) {
        const packagingData = recipe.packaging.map((pkg) => ({
          recipe_id: savedRecipe.id,
          name: pkg.name,
          package_qty: pkg.packageQty,
          unit: pkg.unit,
          package_price: pkg.packagePrice,
          used_qty: pkg.usedQty,
          used_unit: (pkg as { usedUnit?: string }).usedUnit || pkg.unit, // Salva usedUnit
          inventory_item_id: pkg.inventoryItemId || null,
        }));
        
        const { error } = await supabase.from("packaging").insert(packagingData);
        if (error) throw error;
      }

      await fetchRecipes();
      return savedRecipe;
    } catch (error: any) {
      console.error("Error saving recipe:", error);
      toast.error("Erro ao salvar receita");
      return null;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      // Delete related data first
      await supabase.from("ingredients").delete().eq("recipe_id", id);
      await supabase.from("packaging").delete().eq("recipe_id", id);
      await supabase.from("expenses").delete().eq("recipe_id", id);
      
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting recipe:", error);
      toast.error("Erro ao excluir receita");
      return false;
    }
  };

  const duplicateRecipe = async (recipe: Recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      name: `${recipe.name} (Cópia)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const saved = await saveRecipe(newRecipe);
    return saved;
  };

  return {
    recipes,
    loading,
    saveRecipe,
    deleteRecipe,
    duplicateRecipe,
    refetch: fetchRecipes,
  };
}

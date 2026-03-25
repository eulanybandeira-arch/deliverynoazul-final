import { useState, useEffect, useRef } from "react";
import { Ingredient, Packaging, Recipe, Expense } from "@/types/pricing";
import { calculateIngredientValue, calculatePackagingValue, roundToPsychological, formatCurrency } from "@/utils/pricing";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { useRecipes } from "@/hooks/useRecipes";
import { useChannelPricing, ChannelPricing } from "@/hooks/useChannelPricing";
import { IngredientsTable } from "./pricing/IngredientsTable";
import { PackagingTable } from "./pricing/PackagingTable";
import { ResultsGrid } from "./pricing/ResultsGrid";
import { RecipeInfo } from "./pricing/RecipeInfo";
import { MultiChannelPricingPanel, ChannelPricingData } from "./pricing/MultiChannelPricingPanel";
import { LinearProfitGauge } from "./pricing/LinearProfitGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { Library, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export function PricingCalculator() {
  const { recipeId } = useParams<{ recipeId?: string }>();
  const navigate = useNavigate();

  const { recipes, saveRecipe, deleteRecipe } = useRecipes();
  const { pricing: savedChannelPricing, saveBulkPricing } = useChannelPricing(recipeId);

  const [isRecipeStarted, setIsRecipeStarted] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeYield, setRecipeYield] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [profitMargin, setProfitMargin] = useState(0);
  const [fixedCostProportion, setFixedCostProportion] = useState(10);
  const [psychologicalPricing, setPsychologicalPricing] = useState(true);
  const [includeFixedExpenses, setIncludeFixedExpenses] = useState(false);
  const [fixedExpenses] = useState<Expense[]>([]);
  const { items: inventoryItems } = useInventory();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Estado local para precificação multi-canal (sincroniza com savedChannelPricing)
  const [localChannelPricing, setLocalChannelPricing] = useState<ChannelPricingData[]>([]);
  
  // Sincroniza dados salvos do banco com estado local
  useEffect(() => {
    if (savedChannelPricing.length > 0) {
      setLocalChannelPricing(
        savedChannelPricing.map((p) => ({
          channelId: p.channelId,
          targetMargin: p.targetMargin,
          finalPrice: p.finalPrice,
          isActive: p.isActive,
        }))
      );
    }
  }, [savedChannelPricing]);

  // Ref para rastrear qual receita já foi carregada (evita recarregar e sobrescrever edições)
  const loadedRecipeIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Se o recipeId mudou, resetar o ref para permitir novo carregamento
    if (recipeId !== loadedRecipeIdRef.current) {
      // Se estamos navegando para uma receita diferente, resetar
      if (loadedRecipeIdRef.current !== null && recipeId !== loadedRecipeIdRef.current) {
        loadedRecipeIdRef.current = null;
      }
    }

    // Se é nova receita
    if (!recipeId || recipeId === "new") {
      if (loadedRecipeIdRef.current !== "new") {
        setIsRecipeStarted(false);
        setRecipeName("");
        setRecipeYield(0);
        setIngredients([]);
        setPackaging([]);
        setProfitMargin(0);
        setFixedCostProportion(10);
        loadedRecipeIdRef.current = "new";
      }
      return;
    }

    // Se já carregamos esta receita, não recarregar (preserva edições do usuário)
    if (loadedRecipeIdRef.current === recipeId) {
      return;
    }

    // Carregar a receita do array (apenas uma vez)
    if (recipes.length > 0) {
      const recipeToEdit = recipes.find(r => r.id === recipeId);
      if (recipeToEdit) {
        setIsRecipeStarted(true);
        setRecipeName(recipeToEdit.name);
        setRecipeYield(recipeToEdit.yield || 0);
        setIngredients(recipeToEdit.ingredients || []);
        setPackaging(recipeToEdit.packaging || []);
        setProfitMargin(recipeToEdit.profitMargin || 0);
        setFixedCostProportion(recipeToEdit.fixedCostProportion || 10);
        loadedRecipeIdRef.current = recipeId; // Marcar como carregado
      } else {
        toast.error("Receita não encontrada, redirecionando...");
        navigate("/receitas/new");
      }
    }
  }, [recipeId, navigate, recipes]);

  // Corrige dados antigos salvos (bug anterior) para embalagens vinculadas ao estoque:
  // antes: packageQty = quantity_purchased × conversion_factor (total comprado)
  // agora: packageQty = conversion_factor (conteúdo por pacote)
  useEffect(() => {
    if (!recipeId || recipeId === "new") return;
    if (!inventoryItems.length) return;

    setPackaging((prev) =>
      prev.map((pkg) => {
        if (!pkg.inventoryItemId) return pkg;
        const item = inventoryItems.find((i) => i.id === pkg.inventoryItemId);
        if (!item) return pkg;

        const contentPerPurchaseUnit = Number(item.conversion_factor) || 1;
        const buggyTotalUnits = (Number(item.quantity_purchased) || 1) * (Number(item.conversion_factor) || 1);

        const pricePerPurchaseUnit = Number(item.quantity_purchased) > 0
          ? Number(item.total_cost) / Number(item.quantity_purchased)
          : (Number(item.unit_cost) || Number(item.total_cost) || 0);

        const needsQtyFix = pkg.packageQty === buggyTotalUnits;
        const needsPriceFix = pkg.packagePrice === Number(item.total_cost) && Number(item.quantity_purchased) > 1;

        if (!needsQtyFix && !needsPriceFix) return pkg;

        const updated = {
          ...pkg,
          packageQty: needsQtyFix ? contentPerPurchaseUnit : pkg.packageQty,
          packagePrice: needsPriceFix ? pricePerPurchaseUnit : pkg.packagePrice,
          unit: item.stock_unit || item.unit,
          usedUnit: pkg.usedUnit || item.stock_unit || item.unit,
        };

        return { ...updated, usedValue: calculatePackagingValue(updated) };
      })
    );
  }, [inventoryItems, recipeId]);

  const totalIngredientsCost = ingredients.reduce((sum, ing) => sum + ing.usedValue, 0);
  const totalPackagingCost = packaging.reduce((sum, pkg) => sum + pkg.usedValue, 0);
  const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + exp.value, 0);
  
  const totalVariableCost = totalIngredientsCost + totalPackagingCost;
  const proportionalFixedCost = includeFixedExpenses ? totalFixedExpenses * (fixedCostProportion / 100) : 0;
  const totalRecipeCost = totalVariableCost + proportionalFixedCost;
  const unitCost = recipeYield > 0 ? totalRecipeCost / recipeYield : 0;
  
  // Para o ResultsGrid, usamos a margem global (profitMargin) para cálculo de referência
  const priceWithProfit = unitCost * (1 + profitMargin / 100);
  const suggestedPrice = roundToPsychological(priceWithProfit, psychologicalPricing);
  
  const totalRevenue = suggestedPrice * recipeYield;
  const netProfit = totalRevenue - totalRecipeCost;

  const calculationSteps = [
    `Custo Variável Unitário: ${formatCurrency(recipeYield > 0 ? totalVariableCost / recipeYield : 0)}`,
    includeFixedExpenses ? `+ Custo Fixo Proporcional Unitário: ${formatCurrency(recipeYield > 0 ? proportionalFixedCost / recipeYield : 0)}` : '',
    `= Custo Final Unitário: ${formatCurrency(unitCost)}`,
    `+ Margem de Lucro (${profitMargin}%): ${formatCurrency(priceWithProfit - unitCost)}`,
    psychologicalPricing ? `Arredondado: ${formatCurrency(suggestedPrice)}` : '',
  ].filter(Boolean);

  // Handler para atualização de precificação por canal
  // NÃO atualiza a margem global - cada canal é independente após inicialização
  const handleChannelPricingChange = (channelId: string, targetMargin: number, finalPrice: number, isActive?: boolean) => {
    setLocalChannelPricing((prev) => {
      const exists = prev.find((p) => p.channelId === channelId);
      if (exists) {
        return prev.map((p) =>
          p.channelId === channelId ? { ...p, targetMargin, finalPrice, ...(isActive !== undefined && { isActive }) } : p
        );
      }
      return [...prev, { channelId, targetMargin, finalPrice, isActive: isActive ?? true }];
    });
  };

  const addIngredient = () => setIngredients([...ingredients, { id: Date.now().toString(), name: "", packageQty: 1, unit: "g", unitPrice: 0, usedQty: 0, usedValue: 0, loss: 0 }]);
  const removeIngredient = (id: string) => setIngredients(ingredients.filter(i => i.id !== id));
  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const updated = { ...ing, [field]: value };
        return { ...updated, usedValue: calculateIngredientValue(updated) };
      }
      return ing;
    }));
  };
  const updateIngredientFromInventory = (ingredientId: string, item: InventoryItem) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === ingredientId) {
        const costPerPurchaseUnit = item.quantity_purchased > 0 ? item.total_cost / item.quantity_purchased : 0;
        const updated = {
          ...ing,
          inventoryItemId: item.id,
          name: item.name,
          packageQty: item.conversion_factor,
          unit: item.stock_unit,
          unitPrice: costPerPurchaseUnit,
          loss: item.loss || 0,
          // Preserva usedQty e usedUnit se já existirem
          usedQty: ing.usedQty || 0,
          usedUnit: ing.usedUnit || item.stock_unit,
        };
        return { ...updated, usedValue: calculateIngredientValue(updated) };
      }
      return ing;
    }));
  };

  const addPackaging = () => setPackaging([...packaging, { id: Date.now().toString(), name: "", packageQty: 1, unit: "unidade", packagePrice: 0, usedQty: 0, usedValue: 0 }]);
  const removePackaging = (id: string) => setPackaging(packaging.filter(p => p.id !== id));
  const updatePackaging = (id: string, field: keyof Packaging, value: any) => {
    setPackaging(prev => prev.map(pkg => {
      if (pkg.id === id) {
        const updated = { ...pkg, [field]: value };
        return { ...updated, usedValue: calculatePackagingValue(updated) };
      }
      return pkg;
    }));
  };
  const updatePackagingFromInventory = (packagingId: string, item: InventoryItem) => {
    setPackaging(prev => prev.map(pkg => {
      if (pkg.id === packagingId) {
        // Para embalagens: conteúdo por U.C. (quantas U.E. existem em 1 U.C.)
        // Preferir conversion_factor; se vier como 1/0 (dados legados), derivar por current_stock / quantity_purchased.
        const derivedContentPerPurchaseUnit = (() => {
          const cf = Number(item.conversion_factor);
          if (cf && cf > 0 && cf !== 1) return cf;
          const qp = Number(item.quantity_purchased);
          const cs = Number(item.current_stock);
          if (qp > 0 && cs > 0) return cs / qp;
          return cf && cf > 0 ? cf : 1;
        })();

        const packageQty = derivedContentPerPurchaseUnit;
        const packagePrice = item.quantity_purchased > 0
          ? Number(item.total_cost) / Number(item.quantity_purchased)
          : (Number(item.unit_cost) || Number(item.total_cost) || 0);

        const updated = {
          ...pkg,
          inventoryItemId: item.id,
          name: item.name,
          packageQty,
          unit: item.stock_unit || item.unit,
          packagePrice,
          usedQty: pkg.usedQty || 0,
          usedUnit: pkg.usedUnit || item.stock_unit || item.unit,
        };
        return { ...updated, usedValue: calculatePackagingValue(updated) };
      }
      return pkg;
    }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!recipeName) {
      toast.error("Por favor, dê um nome para a receita.");
      return;
    }
    
    const recipeData: Recipe = {
      id: recipeId && recipeId !== "new" ? recipeId : Date.now().toString(),
      name: recipeName,
      yield: recipeYield,
      ingredients,
      packaging,
      profitMargin,
      fixedCostProportion,
      appFee: 0,
      cardFee: 0,
      taxFee: 0,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedRecipe = await saveRecipe(recipeData, status);
    
    // Salva precificação multi-canal se houver dados e a receita foi salva
    if (savedRecipe && localChannelPricing.length > 0) {
      await saveBulkPricing(localChannelPricing, savedRecipe.id);
    }
    
    toast.success(status === 'draft' ? "Rascunho salvo com sucesso!" : "Receita salva com sucesso!");
    
    // Após salvar, navegar para biblioteca sem resetar estado (preserva continuidade)
    navigate("/receitas/biblioteca");
  };

  const handleDeleteRecipe = async () => {
    if (recipeId && recipeId !== "new") {
      await deleteRecipe(recipeId);
      toast.success("Receita excluída com sucesso!");
      navigate("/receitas/biblioteca");
    }
    setDeleteDialogOpen(false);
  };

  if (!isRecipeStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground mb-2">
          Calculadora de Precificação de Receita
        </h1>
        <p className="text-muted-foreground mb-8">
          Calcule o preço ideal para seus produtos com precisão
        </p>
        <Button size="lg" onClick={() => setIsRecipeStarted(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Nova Receita
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">
            {recipeId && recipeId !== "new" ? "Editar Receita" : "Nova Receita"}
          </h1>
          <p className="text-muted-foreground">
            Siga os passos para calcular o preço ideal do seu produto.
          </p>
        </div>
        <NavLink to="/receitas/biblioteca">
          <Button variant="outline">
            <Library className="h-4 w-4 mr-2" />
            Ver Fichas Técnicas
          </Button>
        </NavLink>
      </div>

      <RecipeInfo
        recipeName={recipeName}
        recipeYield={recipeYield}
        onNameChange={setRecipeName}
        onYieldChange={setRecipeYield}
      />

      <IngredientsTable
        ingredients={ingredients}
        inventoryItems={inventoryItems}
        onAdd={addIngredient}
        onRemove={removeIngredient}
        onUpdate={updateIngredient}
        onUpdateFromInventory={updateIngredientFromInventory}
      />

      <PackagingTable
        packaging={packaging}
        inventoryItems={inventoryItems}
        onAdd={addPackaging}
        onRemove={removePackaging}
        onUpdate={updatePackaging}
        onUpdateFromInventory={updatePackagingFromInventory}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="include-fixed-expenses" className="text-base font-semibold">Incluir Despesas Fixas</Label>
              <p className="text-sm text-muted-foreground">Adiciona proporção estratégica das despesas fixas ao custo.</p>
            </div>
            <Switch
              id="include-fixed-expenses"
              checked={includeFixedExpenses}
              onCheckedChange={setIncludeFixedExpenses}
            />
          </div>
          {includeFixedExpenses && (
            <div className="mt-4 pt-4 border-t">
              <Label htmlFor="fixed-cost-proportion">Proporção a ser aplicada (%)</Label>
              <Input
                id="fixed-cost-proportion"
                type="number"
                value={fixedCostProportion}
                onChange={(e) => setFixedCostProportion(Number(e.target.value))}
                className="mt-2"
                placeholder="10"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <LinearProfitGauge
        profitMargin={profitMargin}
        onProfitMarginChange={setProfitMargin}
      />

      <ResultsGrid
        totalCost={totalVariableCost}
        fixedExpenseProportional={proportionalFixedCost}
        suggestedPrice={suggestedPrice}
        totalRevenue={totalRevenue}
        netProfit={netProfit}
        calculationSteps={calculationSteps}
      />

      <MultiChannelPricingPanel 
        baseCost={unitCost}
        recipeYield={recipeYield}
        channelPricingData={localChannelPricing}
        onPricingChange={handleChannelPricingChange}
        minProfitMargin={profitMargin}
      />

      <div className="flex justify-end gap-4 pt-4">
        {recipeId && recipeId !== "new" && (
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>Excluir Receita</Button>
        )}
        <Button variant="outline" onClick={() => handleSave('draft')}>Salvar Rascunho</Button>
        <Button onClick={() => handleSave('published')}>Salvar Receita</Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecipe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
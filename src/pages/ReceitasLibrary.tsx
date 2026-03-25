import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Copy, Trash2, BookOpen, FileText, FileSpreadsheet, TrendingUp, DollarSign, Loader2, Lock } from "lucide-react";
import { Recipe, BusinessIdentity, BusinessMetrics, Ingredient } from "@/types/pricing";
import { roundToPsychological, formatQuantity } from "@/utils/pricing";
import { exportRecipeToPDF, exportRecipeToExcel } from "@/utils/export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useRecipes } from "@/hooks/useRecipes";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { RecipeUploader } from "@/components/recipes/RecipeUploader";
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
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState as useStateEffect } from "react";

export default function ReceitasLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { recipes, loading, deleteRecipe, duplicateRecipe, saveRecipe } = useRecipes();
  const { metrics } = useBusinessMetrics();
  const { isTrial } = useSubscription();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [businessIdentity, setBusinessIdentity] = useStateEffect<BusinessIdentity | null>(null);

  useEffect(() => {
    const fetchBusinessIdentity = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("business_identity")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setBusinessIdentity({
          id: data.id,
          type: (data.type as 'cnpj' | 'cpf' | 'estrangeiro') || 'cpf',
          razaoSocial: data.razao_social || undefined,
          nomeCompleto: data.nome_completo || undefined,
          documento: data.documento || undefined,
          email: data.email || undefined,
          telefone: data.telefone || undefined,
          cep: data.cep || undefined,
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          dadosConfirmados: data.dados_confirmados || false,
        });
      }
    };
    fetchBusinessIdentity();
  }, [user]);

  const getPortionSize = (recipe: Recipe) => {
    const UNIT_TO_GRAMS: Record<string, number> = {
      kg: 1000, g: 1, L: 1000, mL: 1, unidade: 0, pacote: 0, gotas: 0,
      colher_sopa: 15, colher_cha: 5,
      xicara_1_4: 60, xicara_1_3: 80, xicara_1_2: 120,
      xicara_2_3: 160, xicara_3_4: 180, xicara: 240,
    };
    let totalGrams = 0;
    let hasMeasurable = false;
    for (const ing of recipe.ingredients) {
      const unit = ing.usedUnit || ing.unit;
      const factor = UNIT_TO_GRAMS[unit];
      if (factor !== undefined && factor > 0) {
        totalGrams += ing.usedQty * factor;
        hasMeasurable = true;
      }
    }
    if (!hasMeasurable || recipe.yield <= 0) return null;
    const perPortion = totalGrams / recipe.yield;
    if (perPortion >= 1000) return `${(perPortion / 1000).toFixed(1).replace('.0', '')}kg`;
    return `${Math.round(perPortion)}g`;
  };

  const recipeMetrics = recipes.map(recipe => {
    const totalIngredientsCost = recipe.ingredients.reduce((sum, ing) => sum + ing.usedValue, 0);
    const totalPackagingCost = recipe.packaging.reduce((sum, pkg) => sum + pkg.usedValue, 0);
    const cmv = recipe.yield > 0 ? (totalIngredientsCost + totalPackagingCost) / recipe.yield : 0;
    
    return {
      name: recipe.name.length > 15 ? recipe.name.substring(0, 15) + '...' : recipe.name,
      fullName: recipe.name,
      lucratividadePercent: recipe.profitMargin,
      cmv: cmv,
    };
  });

  const topProfitable = [...recipeMetrics]
    .sort((a, b) => b.lucratividadePercent - a.lucratividadePercent)
    .slice(0, 5);

  const lowestCost = [...recipeMetrics]
    .sort((a, b) => a.cmv - b.cmv)
    .slice(0, 5);

  const filteredRecipes = recipes
    .filter((recipe) => recipe.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const TRIAL_RECIPE_LIMIT = 3;
  const trialLimitReached = isTrial && recipes.length >= TRIAL_RECIPE_LIMIT;

  const handleCreateNew = () => {
    if (trialLimitReached) {
      toast.error("Você atingiu o limite de 3 receitas do período de teste. O acesso ilimitado será liberado após os 7 dias!");
      return;
    }
    navigate("/receitas/new");
  };
  const handleEdit = (recipeId: string) => navigate(`/receitas/${recipeId}`);

  const handleRecipeExtracted = async (extractedRecipe: any, hasUnmatchedIngredients: boolean) => {
    try {
      const extractedIngredients = (extractedRecipe.ingredients || []) as Array<{
        name: string;
        quantity: number;
        unit: string;
        matched?: boolean;
        inventoryId?: string;
      }>;

      // Consider only ingredients que a IA conseguiu associar a itens do estoque
      const matchedIngredients = extractedIngredients.filter(
        (ing) => ing.matched && ing.inventoryId
      );

      let ingredients: Ingredient[] = [];

      if (matchedIngredients.length > 0) {
        const inventoryIds = matchedIngredients
          .map((ing) => ing.inventoryId as string)
          .filter(Boolean);

        const { data: inventoryData, error } = await supabase
          .from("inventory_items")
          .select("id, name, stock_unit, unit, cost_per_stock_unit, unit_cost, loss")
          .in("id", inventoryIds);

        if (error) throw error;

        type InventoryRow = {
          id: string;
          name: string;
          stock_unit: string | null;
          unit: string;
          cost_per_stock_unit: number | null;
          unit_cost: number | null;
          loss: number | null;
        };

        const inventoryMap = new Map(
          (inventoryData as InventoryRow[] || []).map((item) => [item.id, item])
        );

        ingredients = matchedIngredients.map((ing) => {
          const item = inventoryMap.get(ing.inventoryId as string) as InventoryRow | undefined;

          const baseUnit = item?.stock_unit || item?.unit || ing.unit;
          const costPerUnit =
            item?.cost_per_stock_unit ?? item?.unit_cost ?? 0;

          return {
            id: crypto.randomUUID(),
            name: item?.name || ing.name,
            // Usamos 1 unidade base com custo por unidade para simplificar o cálculo
            packageQty: 1,
            unit: baseUnit,
            unitPrice: costPerUnit,
            usedQty: ing.quantity,
            usedUnit: ing.unit,
            usedValue: 0,
            loss: item?.loss ?? 0,
            inventoryItemId: item?.id,
          } as Ingredient;
        });
      }

      const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        name: extractedRecipe.name,
        yield: extractedRecipe.yield || 1,
        category: extractedRecipe.category || undefined,
        status: hasUnmatchedIngredients ? "draft" : "published",
        profitMargin: 70,
        appFee: 27,
        cardFee: 5,
        taxFee: 0,
        ingredients,
        packaging: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedRecipe = await saveRecipe(
        newRecipe,
        hasUnmatchedIngredients ? "draft" : "published"
      );

      if (savedRecipe) {
        if (hasUnmatchedIngredients) {
          toast.warning(
            "Receita salva como rascunho. Cadastre os ingredientes faltantes no Estoque."
          );
        } else {
          toast.success("Receita importada com sucesso!");
        }
        navigate(`/receitas/${savedRecipe.id}`);
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error("Erro ao criar receita a partir da importação");
    }
  };
  const handleDuplicate = async (recipe: Recipe) => {
    const result = await duplicateRecipe(recipe);
    if (result) {
      toast.success("Receita duplicada com sucesso");
    }
  };

  const handleDeleteConfirm = async () => {
    if (recipeToDelete) {
      const success = await deleteRecipe(recipeToDelete);
      if (success) {
        toast.success("Receita excluída");
      }
      setRecipeToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const openDeleteDialog = (recipeId: string) => {
    setRecipeToDelete(recipeId);
    setDeleteDialogOpen(true);
  };

  const handleExport = async (recipe: Recipe, format: 'pdf' | 'excel') => {
    const identity = businessIdentity || { 
      type: 'cpf' as const,
      razaoSocial: "",
      nomeCompleto: "",
      documento: ""
    };
    const metricsData: BusinessMetrics = { 
      monthlyRevenue: metrics?.monthly_revenue || 0, 
      workDays: metrics?.work_days || 0, 
      workDaysPerWeek: metrics?.work_days_per_week || 0, 
      dailyTarget: metrics?.daily_target || 0,
      minProfitMargin: (metrics as { min_profit_margin?: number })?.min_profit_margin || 30
    };

    if (!identity.razaoSocial && !identity.nomeCompleto) {
      toast.error("Configure as informações do seu negócio antes de exportar.", {
        description: "Vá para a página de configurações para adicionar os dados de cadastro.",
      });
      return;
    }

    const totalIngredientsCost = recipe.ingredients.reduce((sum, ing) => sum + ing.usedValue, 0);
    const totalPackagingCost = recipe.packaging.reduce((sum, pkg) => sum + pkg.usedValue, 0);
    const totalCost = totalIngredientsCost + totalPackagingCost;
    const unitCost = recipe.yield > 0 ? totalCost / recipe.yield : 0;
    const priceWithProfit = unitCost * (1 + recipe.profitMargin / 100);
    const suggestedPrice = roundToPsychological(priceWithProfit, true);
    const totalRevenue = suggestedPrice * recipe.yield;

    if (format === 'pdf') {
      await exportRecipeToPDF(recipe, identity, metricsData, totalCost, unitCost, suggestedPrice, totalRevenue);
    } else {
      exportRecipeToExcel(recipe, identity, metricsData, totalCost, unitCost, suggestedPrice, totalRevenue);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Fichas Técnicas de Receitas</h1>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <RecipeUploader onRecipeExtracted={handleRecipeExtracted} />
          <Button onClick={handleCreateNew} disabled={trialLimitReached} className={cn(trialLimitReached && "opacity-60")}>
            {trialLimitReached && <Lock className="h-4 w-4 mr-2" />}
            {!trialLimitReached && <Plus className="h-4 w-4 mr-2" />}
            Nova Receita
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Maior Lucratividade</CardTitle>
                <CardDescription className="text-xs">Top 5 receitas por margem de lucro</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {topProfitable.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Nenhuma receita cadastrada
              </div>
            ) : (
              <div className="space-y-3">
                {topProfitable.map((item, index) => (
                  <div key={index} className="group flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate pr-2" title={item.fullName}>{item.fullName}</span>
                        <span className="text-sm font-bold text-primary whitespace-nowrap">{item.lucratividadePercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
                          style={{ width: `${Math.min(item.lucratividadePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 text-accent-foreground">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Menor CMV</CardTitle>
                <CardDescription className="text-xs">Top 5 receitas por menor custo de mercadoria</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {lowestCost.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Nenhuma receita cadastrada
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const maxCmv = Math.max(...lowestCost.map(i => i.cmv), 1);
                  return lowestCost.map((item, index) => (
                    <div key={index} className="group flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-right">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate pr-2" title={item.fullName}>{item.fullName}</span>
                          <span className="text-sm font-bold text-brand-cyan whitespace-nowrap">R$ {item.cmv.toFixed(2)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-brand-cyan/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-cyan/60 to-brand-cyan transition-all duration-500"
                            style={{ width: `${Math.max(((maxCmv - item.cmv) / maxCmv) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma receita cadastrada</p>
          <Button onClick={handleCreateNew}>Criar Primeira Receita</Button>
        </div>
      ) : (
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{recipe.name}</span>
                        {recipe.status === 'draft' && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Rascunho</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Rendimento: {recipe.yield} {recipe.yield === 1 ? 'porção' : 'porções'}
                        {(() => { const ps = getPortionSize(recipe); return ps ? ` de ${ps}` : ''; })()}
                      </span>
                    </div>
                  </div>
                  <TooltipProvider>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(recipe.id)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(recipe)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicar</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExport(recipe, 'pdf')}>
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>PDF</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExport(recipe, 'excel')}>
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excel</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(recipe.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </UITooltip>
                    </div>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

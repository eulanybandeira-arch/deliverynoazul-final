import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet, TrendingUp, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/pricing";
import { useCashFlow, CashFlowEntry } from "@/hooks/useCashFlow";
import { useInventory } from "@/hooks/useInventory";
import { useStockMovements } from "@/hooks/useStockMovements";
import { CashFlowForm } from "@/components/cash-flow/CashFlowForm";
import { CashFlowTable } from "@/components/cash-flow/CashFlowTable";
import { CashFlowImporter } from "@/components/cash-flow/CashFlowImporter";
import { getDaysInMonth, parseISO, isSameMonth, isSameYear } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface RecipeFromDB {
  id: string;
  name: string;
  yield: number;
  ingredients?: Array<{ name: string; usedQty: number; unit?: string; inventoryItemId?: string }>;
  packaging?: Array<{ name: string; usedQty: number; unit?: string; inventoryItemId?: string }>;
}

const generateYearOptions = (startYear: number) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= Math.max(currentYear, startYear) + 5; year++) {
    years.push(year);
  }
  return years;
};

const monthOptions = [
  { value: "0", label: "Janeiro" }, { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" }, { value: "3", label: "Abril" },
  { value: "4", label: "Maio" }, { value: "5", label: "Junho" },
  { value: "6", label: "Julho" }, { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" }, { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" }, { value: "11", label: "Dezembro" },
];

export default function FluxoCaixa() {
  const { user } = useAuth();
  const { entries, loading: loadingCashFlow, addEntry, deleteEntry, importEntries } = useCashFlow();
  const { items: inventoryItems, updateStock } = useInventory();
  const { addMovement } = useStockMovements();
  const [recipes, setRecipes] = useState<RecipeFromDB[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  
  const yearOptions = generateYearOptions(2024);

  // Fetch recipes with ingredients and packaging from Supabase
  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;
      
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("id, name, yield")
        .eq("user_id", user.id);
      
      if (!recipesData) return;

      // Fetch ingredients and packaging for each recipe
      const recipesWithItems = await Promise.all(
        recipesData.map(async (recipe) => {
          const [ingredientsRes, packagingRes] = await Promise.all([
            supabase.from("ingredients").select("*").eq("recipe_id", recipe.id),
            supabase.from("packaging").select("*").eq("recipe_id", recipe.id),
          ]);

          return {
            ...recipe,
            ingredients: (ingredientsRes.data || []).map((i: any) => ({
              name: i.name,
              usedQty: i.used_qty,
              unit: i.unit,
              inventoryItemId: i.inventory_item_id,
            })),
            packaging: (packagingRes.data || []).map((p: any) => ({
              name: p.name,
              usedQty: p.used_qty,
              unit: p.unit,
              inventoryItemId: p.inventory_item_id,
            })),
          };
        })
      );

      setRecipes(recipesWithItems);
    };
    fetchRecipes();
  }, [user]);

  const filteredEntries = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    return entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isSameYear(entryDate, new Date(year, 0)) && isSameMonth(entryDate, new Date(year, month));
    });
  }, [entries, selectedMonth, selectedYear]);

  const chartData = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: String(i + 1).padStart(2, '0'),
      Entradas: 0,
      Saídas: 0,
    }));

    filteredEntries.forEach(entry => {
      if (entry.status === 'efetuado') {
        const dayOfMonth = parseISO(entry.date).getDate() - 1;
        if (dailyData[dayOfMonth]) {
          if (entry.type === 'entrada') {
            dailyData[dayOfMonth].Entradas += entry.value;
          } else {
            dailyData[dayOfMonth].Saídas += entry.value;
          }
        }
      }
    });
    return dailyData;
  }, [filteredEntries, selectedMonth, selectedYear]);

  const handleAddEntry = async (entryData: Omit<CashFlowEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    // Lógica de Venda e Baixa de Estoque
    if (entryData.type === 'entrada' && entryData.category === 'venda' && entryData.recipe_id && entryData.quantity_sold) {
      const recipe = recipes.find(r => r.id === entryData.recipe_id);
      if (!recipe) {
        toast.error("Receita selecionada não encontrada.");
        return;
      }
      if (!recipe.yield || recipe.yield <= 0) {
        toast.error(`A receita "${recipe.name}" não tem um rendimento válido cadastrado.`);
        return;
      }

      // Verificar estoque e atualizar
      const toFixed4 = (num: number) => Math.round(num * 10000) / 10000;
      const itemsToUpdate: { id: string; name: string; previousStock: number; newStock: number; quantity: number }[] = [];
      let stockSufficient = true;

      [...(recipe.ingredients || []), ...(recipe.packaging || [])].forEach(item => {
        if (!item.inventoryItemId) return;
        const inventoryItem = inventoryItems.find(invItem => invItem.id === item.inventoryItemId);
        
        if (!inventoryItem) {
          stockSufficient = false;
          toast.error(`Insumo "${item.name}" não encontrado no estoque.`);
          return;
        }

        const requiredQtyPerPortion = toFixed4(item.usedQty / recipe.yield);
        const totalRequiredQty = toFixed4(requiredQtyPerPortion * (entryData.quantity_sold || 1));

        if (toFixed4(inventoryItem.current_stock) < totalRequiredQty) {
          stockSufficient = false;
          toast.error(`Estoque insuficiente para "${item.name}".`);
          return;
        }
        itemsToUpdate.push({ 
          id: inventoryItem.id, 
          name: inventoryItem.name,
          previousStock: inventoryItem.current_stock,
          newStock: toFixed4(inventoryItem.current_stock - totalRequiredQty),
          quantity: totalRequiredQty
        });
      });

      if (!stockSufficient) return;

      // Atualizar estoque e registrar movimentações
      for (const item of itemsToUpdate) {
        await updateStock(item.id, item.newStock);
        
        // Registrar movimentação
        await addMovement({
          inventory_item_id: item.id,
          movement_type: 'venda',
          quantity: item.quantity,
          previous_stock: item.previousStock,
          new_stock: item.newStock,
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          notes: `Venda de ${entryData.quantity_sold} unidade(s) - ${entryData.description}`,
        });
      }
    }

    const result = await addEntry(entryData);
    if (result) {
      toast.success("Lançamento adicionado com sucesso!");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const success = await deleteEntry(id);
    if (success) {
      toast.success("Lançamento excluído.");
    }
  };

  const handleImportEntries = async (importedEntries: Omit<CashFlowEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
    const count = await importEntries(importedEntries);
    if (count > 0) {
      toast.success(`${count} novos lançamentos importados com sucesso!`);
    } else {
      toast.info("Nenhum lançamento novo para importar.");
    }
  };

  const totalIncome = filteredEntries
    .filter(e => e.type === 'entrada' && e.status === 'efetuado')
    .reduce((sum, e) => sum + e.value, 0);
  const totalOutcome = filteredEntries
    .filter(e => e.type === 'saída' && e.status === 'efetuado')
    .reduce((sum, e) => sum + e.value, 0);
  const balance = totalIncome - totalOutcome;

  if (loadingCashFlow) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Fluxo de Caixa</h1>
        <p className="text-muted-foreground">
          Acompanhe suas entradas e saídas financeiras para manter a saúde do seu negócio.
        </p>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <CashFlowImporter onImport={handleImportEntries} />
            <Button variant="outline" onClick={() => toast.info("Exportar PDF em desenvolvimento.")}><FileText className="h-4 w-4 mr-2" />Exportar PDF</Button>
            <Button variant="outline" onClick={() => toast.info("Exportar Excel em desenvolvimento.")}><FileSpreadsheet className="h-4 w-4 mr-2" />Exportar Excel</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas do Mês</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas do Mês</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{formatCurrency(totalOutcome)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
          </CardHeader>
          <CardContent><div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(balance)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Análise do Mês</CardTitle>
          <CardDescription>Demonstração de entradas e saídas diárias (apenas lançamentos efetuados).</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `R$${value}`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              <Line type="monotone" dataKey="Entradas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <CashFlowForm recipes={recipes} onSubmit={handleAddEntry} />
      <CashFlowTable entries={filteredEntries} onDelete={handleDeleteEntry} />
    </div>
  );
}

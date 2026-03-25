import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useInventory } from "@/hooks/useInventory";
import { useRecipes } from "@/hooks/useRecipes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseISO, isSameMonth, isSameYear } from 'date-fns';
import { StockMovementsHistory } from "@/components/inventory/StockMovementsHistory";

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

export default function InventoryBalance() {
  const { items: allInventoryItems } = useInventory();
  const { recipes: allRecipes } = useRecipes();

  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalStockValue, setTotalStockValue] = useState(0);
  
  const yearOptions = generateYearOptions(2024);

  useEffect(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);

    const monthlyInventoryItems = allInventoryItems.filter(item => {
      const itemDate = parseISO(item.created_at);
      return isSameYear(itemDate, year) && isSameMonth(itemDate, month);
    });

    const calculateConsumption = (inventoryItemId: string) => {
      let totalConsumption = 0;
      allRecipes.forEach(recipe => {
        (recipe.ingredients || []).forEach((ingredient: any) => {
          if (ingredient.inventoryItemId === inventoryItemId) {
            totalConsumption += ingredient.usedQty || ingredient.used_qty || 0;
          }
        });
        (recipe.packaging || []).forEach((pkg: any) => {
          if (pkg.inventoryItemId === inventoryItemId) {
            totalConsumption += pkg.usedQty || pkg.used_qty || 0;
          }
        });
      });
      return totalConsumption;
    };

    const newChartData = monthlyInventoryItems.map((item) => {
      const consumption = calculateConsumption(item.id);
      const initialStock = 0; // Since we filter by purchase month, initial stock is 0
      const purchases = item.quantity_purchased;
      const finalStock = item.current_stock; // Note: this is live stock, not end-of-month

      return {
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        "Estoque Inicial": initialStock,
        "Compras (Entradas)": purchases,
        "Consumo (Saídas)": consumption,
        "Estoque Final": finalStock,
      };
    });

    setChartData(newChartData);

    const totalValue = allInventoryItems.reduce((acc, item) => {
      return acc + (item.cost_per_stock_unit * item.current_stock);
    }, 0);
    setTotalStockValue(totalValue);

  }, [selectedMonth, selectedYear, allInventoryItems, allRecipes]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Balanço Mensal de Estoque</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho e o fluxo do seu estoque
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo total da mercadoria atualmente em estoque.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row justify-start items-center gap-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Balanço de Estoque da Empresa Mensal
          </CardTitle>
          <CardDescription>
            Exibindo balanço para insumos comprados no mês selecionado. (Dados de consumo são uma estimativa baseada nas receitas salvas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma compra de insumo registrada no mês selecionado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  cursor={{ stroke: 'hsl(var(--muted))' }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="Estoque Inicial" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Compras (Entradas)" stroke="hsl(var(--accent))" strokeWidth={2} />
                <Line type="monotone" dataKey="Consumo (Saídas)" stroke="#FFA500" strokeWidth={2} />
                <Line type="monotone" dataKey="Estoque Final" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <StockMovementsHistory title="Últimas Movimentações de Estoque" limit={20} />
    </div>
  );
}
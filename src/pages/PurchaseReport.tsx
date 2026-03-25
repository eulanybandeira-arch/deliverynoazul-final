import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ClipboardList, DollarSign } from "lucide-react";
import { LOGISTICS_CATEGORY_OPTIONS } from "@/types/inventory";
import { useInventory } from "@/hooks/useInventory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#007BFF', '#584ED3', '#17A2B8', '#E83E8C'];

export default function PurchaseReport() {
  const { items: inventoryItems } = useInventory();

  const monthlyData = inventoryItems.reduce((acc, item) => {
    const month = format(new Date(item.created_at), "MMM/yy", { locale: ptBR });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += item.total_cost;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.keys(monthlyData).map(month => ({
    name: month,
    value: monthlyData[month],
  })).sort((a, b) => {
    const monthsMap: Record<string, number> = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    const [monthA, yearA] = a.name.toLowerCase().split('/');
    const [monthB, yearB] = b.name.toLowerCase().split('/');
    return new Date(parseInt(yearA), monthsMap[monthA] || 0).getTime() - new Date(parseInt(yearB), monthsMap[monthB] || 0).getTime();
  });

  const categoryData = inventoryItems.reduce((acc, item) => {
    const category = item.category_logistics || "outros";
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += item.total_cost;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.keys(categoryData).map(key => ({
    name: LOGISTICS_CATEGORY_OPTIONS.find(opt => opt.value === key)?.label || key,
    value: categoryData[key],
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Relatório de Compras</h1>
        <p className="text-muted-foreground">
          Analise suas compras para prever demandas e otimizar investimentos
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Compras por Mês
            </CardTitle>
            <CardDescription>
              Total gasto em insumos mensalmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {monthlyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma compra registrada.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Investimento por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de gastos entre as categorias de insumos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma compra registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
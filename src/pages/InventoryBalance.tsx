import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Calculator, TrendingUp, AlertCircle, FileSearch, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useInventory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";

const COLORS = ["#4B86E8", "#53D2E8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function InventoryBalance() {
  const { items } = useInventory();
  
  // Estados dos Filtros
  const [revenue, setRevenue] = useState<number>(0);
  const [targetCMV, setTargetCMV] = useState<number>(30);
  const [initialDate, setInitialDate] = useState("2024-03-01");
  const [finalDate, setFinalDate] = useState("2024-03-31");
  const [isGenerated, setIsGenerated] = useState(false);

  // Mock de datas de inventário (em um cenário real viria do banco)
  const inventoryDates = [
    "2024-01-01", "2024-01-31", "2024-02-01", "2024-02-29", "2024-03-01", "2024-03-31"
  ];

  // Cálculos do Diagnóstico
  const diagnosis = useMemo(() => {
    // Simulação de valores para demonstração da lógica EI + C - EF
    const tableData = items.map(item => {
      const estInicial = (item.current_stock * 0.8); // Simulado
      const entradas = (item.quantity_purchased || 0); // Simulado
      const estFinal = item.current_stock;
      const consumoReal = (estInicial + entradas) - estFinal;
      const custoTotal = consumoReal * (item.cost_per_stock_unit || 0);

      return {
        ...item,
        estInicial,
        entradas,
        estFinal,
        consumoReal,
        custoTotal
      };
    });

    const totalCost = tableData.reduce((acc, item) => acc + Math.max(0, item.custoTotal), 0);
    const realCMV = revenue > 0 ? (totalCost / revenue) * 100 : 0;

    // Agrupamento por categoria para o gráfico
    const categoryMap: Record<string, number> = {};
    tableData.forEach(item => {
      const cat = item.category_logistics || "Outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + Math.max(0, item.custoTotal);
    });

    const chartData = Object.entries(categoryMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    })).sort((a, b) => b.value - a.value);

    return { tableData, totalCost, realCMV, chartData };
  }, [items, revenue]);

  const handleGenerate = () => {
    if (revenue <= 0) {
      return;
    }
    setIsGenerated(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Diagnóstico de CMV Real</h1>
        <p className="text-muted-foreground">
          Cruze seus inventários com o faturamento para descobrir sua lucratividade real.
        </p>
      </header>

      {/* 1. Barra de Filtros */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Inventário Inicial</label>
              <Select value={initialDate} onValueChange={setInitialDate}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inventoryDates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Inventário Final</label>
              <Select value={finalDate} onValueChange={setFinalDate}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inventoryDates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Faturamento (R$)</label>
              <Input 
                type="number" 
                placeholder="0,00" 
                className="bg-background"
                value={revenue || ""}
                onChange={(e) => setRevenue(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Meta de CMV (%)</label>
              <Input 
                type="number" 
                placeholder="30" 
                className="bg-background"
                value={targetCMV || ""}
                onChange={(e) => setTargetCMV(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleGenerate} className="w-full bg-primary hover:bg-primary/90 gap-2">
              <FileSearch className="h-4 w-4" /> Gerar Diagnóstico
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGenerated && (
        <>
          {/* 2. Painel de Resultados */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase">Faturamento Informado</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(revenue)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase">Custo Total Apurado</CardDescription>
                <CardTitle className="text-2xl text-primary">{formatCurrency(diagnosis.totalCost)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase">Sua Meta</CardDescription>
                <CardTitle className="text-2xl text-muted-foreground">{targetCMV}%</CardTitle>
              </CardHeader>
            </Card>
            <Card className={cn(
              "md:col-span-1 border-2 transition-colors",
              diagnosis.realCMV <= targetCMV ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"
            )}>
              <CardHeader className="pb-2">
                <CardDescription className={cn(
                  "text-xs font-bold uppercase",
                  diagnosis.realCMV <= targetCMV ? "text-primary" : "text-destructive"
                )}>
                  CMV Real do Período
                </CardDescription>
                <div className="flex items-baseline gap-2">
                  <CardTitle className={cn(
                    "text-4xl font-black",
                    diagnosis.realCMV <= targetCMV ? "text-primary" : "text-destructive"
                  )}>
                    {diagnosis.realCMV.toFixed(1)}%
                  </CardTitle>
                  {diagnosis.realCMV > targetCMV && <AlertCircle className="h-5 w-5 text-destructive" />}
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* 3. Visão por Categorias */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Custo por Categoria</CardTitle>
                <CardDescription>Onde seu dinheiro foi consumido</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diagnosis.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {diagnosis.chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 4. Tabela de Raio-X */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase">Raio-X de Consumo por Insumo</CardTitle>
                <CardDescription>Detalhamento técnico da movimentação física e financeira</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Insumo</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Est. Inicial</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Entradas</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Est. Final</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Consumo Real</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnosis.tableData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="py-2">
                            <div className="font-medium text-xs">{item.name}</div>
                            <div className="text-[9px] text-muted-foreground uppercase">{item.category_logistics}</div>
                          </TableCell>
                          <TableCell className="text-xs text-center">{item.estInicial.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-center">{item.entradas.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-center">{item.estFinal.toFixed(2)}</TableCell>
                          <TableCell className={cn(
                            "text-xs text-center font-bold",
                            item.consumoReal < 0 ? "text-destructive bg-destructive/10" : ""
                          )}>
                            {item.consumoReal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {formatCurrency(item.custoTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!isGenerated && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <Calculator className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="font-bold text-lg">Aguardando Dados</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Informe o faturamento e a meta desejada acima para gerar o diagnóstico de lucratividade.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary animate-bounce" />
        </div>
      )}
    </div>
  );
}
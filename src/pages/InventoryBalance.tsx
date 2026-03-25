import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Calendar as CalendarIcon, FileSearch, ArrowRight, Calculator, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useInventory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const COLORS = ["#4B86E8", "#53D2E8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function InventoryBalance() {
  const { items } = useInventory();
  
  // Estados dos Filtros
  const [initialDate, setInitialDate] = useState<Date | undefined>(new Date(new Date().setDate(1)));
  const [finalDate, setFinalDate] = useState<Date | undefined>(new Date());
  const [revenue, setRevenue] = useState<number>(0);
  const [targetCMV, setTargetCMV] = useState<number>(30);
  const [isGenerated, setIsGenerated] = useState(false);

  // Cálculos do Diagnóstico
  const diagnosis = useMemo(() => {
    // Simulação de valores para demonstração da lógica EI + C - EF
    const tableData = items.map(item => {
      const estInicial = (item.current_stock * 0.85); // Simulado
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
      value,
      percent: totalCost > 0 ? (value / totalCost) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return { tableData, totalCost, realCMV, chartData };
  }, [items, revenue]);

  const handleGenerate = () => {
    if (revenue <= 0) {
      return;
    }
    setIsGenerated(true);
  };

  const isWithinTarget = diagnosis.realCMV <= targetCMV;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight text-primary dark:text-foreground">
          Diagnóstico de CMV Real
        </h1>
        <p className="text-muted-foreground text-lg">
          A verdade sobre a sua lucratividade baseada no seu estoque físico.
        </p>
      </header>

      {/* 1. Barra de Filtros (Visual Sutil) */}
      <Card className="bg-card/40 backdrop-blur-sm border-border/40 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inventário Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {initialDate ? format(initialDate, "dd/MM/yyyy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={initialDate} onSelect={setInitialDate} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inventário Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {finalDate ? format(finalDate, "dd/MM/yyyy") : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={finalDate} onSelect={setFinalDate} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faturamento (R$)</label>
              <Input 
                type="number" 
                placeholder="0,00" 
                className="h-11 text-lg font-medium"
                value={revenue || ""}
                onChange={(e) => setRevenue(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta de CMV (%)</label>
              <Input 
                type="number" 
                placeholder="30" 
                className="h-11 text-lg font-medium"
                value={targetCMV || ""}
                onChange={(e) => setTargetCMV(Number(e.target.value))}
              />
            </div>

            <Button onClick={handleGenerate} className="w-full h-11 bg-primary hover:bg-primary/90 gap-2 text-base font-bold shadow-lg shadow-primary/20">
              <FileSearch className="h-5 w-5" /> Gerar Diagnóstico
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGenerated ? (
        <>
          {/* 2. Painel de Resultados (Duas Colunas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda: CMV Real Impactante */}
            <Card className={cn(
              "relative overflow-hidden border-none shadow-2xl transition-all duration-500 flex flex-col justify-center items-center p-12 min-h-[400px]",
              isWithinTarget 
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" 
                : "bg-gradient-to-br from-red-600 to-red-700 text-white"
            )}>
              <div className="absolute top-6 left-6 opacity-20">
                <Calculator className="h-24 w-24" />
              </div>
              
              <div className="relative z-10 text-center space-y-4">
                <h3 className="text-xl font-bold uppercase tracking-widest opacity-90">
                  CMV Real do Período
                </h3>
                <div className="text-9xl font-black tracking-tighter">
                  {diagnosis.realCMV.toFixed(1)}%
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-medium opacity-90">
                    {isWithinTarget ? "Você está no Azul! 🎉" : "Atenção! CMV acima da meta. ⚠️"}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-widest bg-white/20 py-2 px-4 rounded-full inline-block">
                    Comparado à sua Meta de {targetCMV}%
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 p-8 opacity-10">
                {isWithinTarget ? <CheckCircle2 className="h-40 w-40" /> : <AlertCircle className="h-40 w-40" />}
              </div>
            </Card>

            {/* Coluna Direita: Gráfico de Rosca */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-xl flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  CMV por Categoria
                </CardTitle>
                <CardDescription>Distribuição do custo total apurado</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center min-h-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={diagnosis.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {diagnosis.chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {value} ({entry.payload.percent.toFixed(1)}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 3. Tabela Detalhada (Rodapé) */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold uppercase tracking-wider">Raio-X de Consumo por Insumo</CardTitle>
              <CardDescription>Detalhamento técnico da movimentação física e financeira no período selecionado.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-black uppercase py-4">Insumo</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-center">Estoque Inicial</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-center">Entradas</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-center">Estoque Final</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-center">Consumo Real</TableHead>
                      <TableHead className="text-[11px] font-black uppercase text-right">Custo Total Apurado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnosis.tableData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="font-bold text-sm">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium">{item.category_logistics}</div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.estInicial.toFixed(2)} {item.stock_unit}</TableCell>
                        <TableCell className="text-center font-medium text-primary">+{item.entradas.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-medium">{item.estFinal.toFixed(2)} {item.stock_unit}</TableCell>
                        <TableCell className={cn(
                          "text-center font-black",
                          item.consumoReal < 0 ? "text-red-500 bg-red-500/10" : "text-foreground"
                        )}>
                          {item.consumoReal.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-black text-primary">
                          {formatCurrency(item.custoTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/60">
          <div className="p-6 bg-background rounded-full shadow-xl">
            <Calculator className="h-16 w-16 text-primary/40" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-2xl">Aguardando Dados do Período</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-lg">
              Informe o faturamento e a meta desejada acima para gerar o diagnóstico de lucratividade real.
            </p>
          </div>
          <ArrowRight className="h-8 w-8 text-primary animate-bounce" />
        </div>
      )}
    </div>
  );
}
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calculator, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  FileSearch
} from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useInventory } from "@/hooks/useInventory";
import { cn } from "@/lib/utils";

export default function InventoryBalance() {
  const { items } = useInventory();
  
  // Estados dos Filtros e Parâmetros
  const [rawRevenue, setRawRevenue] = useState("");
  const [rawTarget, setRawTarget] = useState("3000"); // 30.00%
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const [finalDate, setFinalDate] = useState<Date | undefined>(undefined);
  const [isCalculated, setIsCalculated] = useState(false);

  // Máscara de Moeda BRL
  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setRawRevenue(value);
  };

  const formattedRevenue = useMemo(() => {
    const num = parseInt(rawRevenue || "0") / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  }, [rawRevenue]);

  // Máscara de Porcentagem
  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setRawTarget(value);
  };

  const formattedTarget = useMemo(() => {
    const num = parseInt(rawTarget || "0") / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  }, [rawTarget]);

  // Cálculos do Diagnóstico
  const diagnosis = useMemo(() => {
    const revenueNum = parseInt(rawRevenue || "0") / 100;
    const targetNum = parseInt(rawTarget || "0") / 100;

    const tableData = items.map(item => {
      const unitCost = item.cost_per_stock_unit || 0;
      const estInicialR$ = (item.current_stock * 0.9) * unitCost; 
      const entradasR$ = (item.quantity_purchased * (item.conversion_factor || 1)) * unitCost;
      const estFinalR$ = item.current_stock * unitCost;
      const saidasR$ = (estInicialR$ + entradasR$) - estFinalR$;
      
      return {
        ...item,
        estInicialR$,
        entradasR$,
        estFinalR$,
        saidasR$,
        custoMedio: unitCost
      };
    });

    const totalCMV_R$ = tableData.reduce((acc, item) => acc + Math.max(0, item.saidasR$), 0);
    const realCMV_Percent = revenueNum > 0 ? (totalCMV_R$ / revenueNum) * 100 : 0;

    return { 
      tableData, 
      totalCMV_R$, 
      realCMV_Percent, 
      revenueNum, 
      targetNum,
      isSuccess: realCMV_Percent <= targetNum 
    };
  }, [items, rawRevenue, rawTarget]);

  const handleCalculate = () => {
    if (!rawRevenue || parseInt(rawRevenue) === 0) return;
    setIsCalculated(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full px-2">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Diagnóstico de CMV Real</h1>
        <p className="text-muted-foreground">Apuração técnica baseada na movimentação física de estoque (EI + C - EF).</p>
      </header>

      {/* 1. Parâmetros de Cálculo (Barra Horizontal Full Width) */}
      <Card className="border-border/40 shadow-sm bg-card/50 w-full">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inventário Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !initialDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {initialDate ? format(initialDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={initialDate} onSelect={setInitialDate} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inventário Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !finalDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {finalDate ? format(finalDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={finalDate} onSelect={setFinalDate} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Faturamento (R$)</label>
              <Input 
                value={rawRevenue === "" ? "" : formattedRevenue}
                onChange={handleRevenueChange}
                placeholder="R$ 0,00"
                className="h-10 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sua Meta CMV (%)</label>
              <Input 
                value={formattedTarget}
                onChange={handleTargetChange}
                className="h-10 font-medium"
              />
            </div>

            <Button 
              onClick={handleCalculate} 
              className="h-10 bg-[#002B5B] hover:bg-[#001f3f] text-white font-bold transition-colors"
            >
              Calcular Diagnóstico
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCalculated ? (
        <>
          {/* 2. O Diagnóstico Visual (Cards Estruturados) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            <Card className={cn(
              "md:col-span-1 border-none shadow-lg transition-all duration-500 flex flex-col justify-center items-center p-8 min-h-[220px] text-white",
              diagnosis.isSuccess ? "bg-[#002B5B]" : "bg-[#991b1b]"
            )}>
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">CMV Real do Período</p>
                <div className="text-6xl font-black tracking-tighter">
                  {diagnosis.realCMV_Percent.toFixed(2)}%
                </div>
                <p className="text-xs font-bold uppercase tracking-wider bg-white/20 py-1 px-3 rounded-full inline-block">
                  Meta: {diagnosis.targetNum.toFixed(2)}%
                </p>
              </div>
              <div className="mt-4">
                {diagnosis.isSuccess ? <CheckCircle2 className="h-8 w-8 opacity-40" /> : <AlertCircle className="h-8 w-8 opacity-40" />}
              </div>
            </Card>

            <Card className="border-border/40 shadow-sm flex flex-col justify-center">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Seu CMV (R$)</CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(diagnosis.totalCMV_R$)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground">Custo total de insumos consumidos.</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm flex flex-col justify-center">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Faturamento Bruto</CardDescription>
                <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(diagnosis.revenueNum)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground">Receita total informada no período.</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm flex flex-col justify-center">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Sua Meta vs. Real</CardDescription>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-muted-foreground">{diagnosis.targetNum.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">vs.</span>
                  <span className={cn("text-2xl font-bold", diagnosis.isSuccess ? "text-[#002B5B]" : "text-[#991b1b]")}>
                    {diagnosis.realCMV_Percent.toFixed(1)}%
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={cn("h-full transition-all duration-1000", diagnosis.isSuccess ? "bg-[#002B5B]" : "bg-[#991b1b]")}
                    style={{ width: `${Math.min(diagnosis.realCMV_Percent, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Raio-X Detalhado (Tabela Full Width) */}
          <Card className="border-border/40 shadow-sm overflow-hidden w-full">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Raio-X de Movimentação Financeira</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                    <TableRow className="hover:bg-transparent border-b border-border/40">
                      <TableHead className="text-[10px] font-bold uppercase py-4">Insumo</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Categoria</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Est. Inicial (R$)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Entradas (R$)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Est. Final (R$)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Saídas (R$)</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Custo Médio</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">% Repres.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnosis.tableData.map((item) => {
                      const representativity = diagnosis.totalCMV_R$ > 0 
                        ? (Math.max(0, item.saidasR$) / diagnosis.totalCMV_R$) * 100 
                        : 0;

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/20">
                          <TableCell className="py-4 font-semibold text-sm">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter">
                              {item.category_logistics}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(item.estInicialR$)}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-blue-600">+{formatCurrency(item.entradasR$)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{formatCurrency(item.estFinalR$)}</TableCell>
                          <TableCell className={cn(
                            "text-right font-bold text-xs",
                            item.saidasR$ < 0 ? "text-red-600" : "text-foreground"
                          )}>
                            {formatCurrency(item.saidasR$)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatCurrency(item.custoMedio)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-bold text-primary">
                              {representativity.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-muted/10 rounded-3xl border border-dashed border-border/60 w-full">
          <div className="p-5 bg-background rounded-full shadow-sm border border-border/40">
            <Calculator className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-xl">Aguardando Parâmetros</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Selecione os inventários e informe o faturamento bruto para gerar o diagnóstico de lucratividade real.
            </p>
          </div>
          <ArrowRight className="h-6 w-6 text-primary animate-bounce" />
        </div>
      )}
    </div>
  );
}
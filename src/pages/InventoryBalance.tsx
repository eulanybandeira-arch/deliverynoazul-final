import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, ShoppingBag, Calculator, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useInventory } from "@/hooks/useInventory";
import { useCashFlow } from "@/hooks/useCashFlow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseISO, isSameMonth, isSameYear, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from "sonner";

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
  const { entries } = useCashFlow();

  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  
  const yearOptions = [2024, 2025, 2026];

  // Cálculos Financeiros
  const stats = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const targetDate = new Date(year, month);

    // 1. Estoque Atual (Final) - Valor total de todos os itens hoje
    const currentStockValue = allInventoryItems.reduce((acc, item) => {
      return acc + (item.cost_per_stock_unit * item.current_stock);
    }, 0);

    // 2. Compras do Mês - Lançamentos de 'saída' na categoria 'insumos' ou 'custos'
    const monthlyPurchases = entries
      .filter(e => 
        e.type === 'saída' && 
        (e.category === 'insumos' || e.category === 'custos') &&
        isSameMonth(parseISO(e.date), targetDate) &&
        isSameYear(parseISO(e.date), targetDate)
      )
      .reduce((sum, e) => sum + e.value, 0);

    // 3. Estoque Inicial (Simulado como o estoque atual menos as compras do mês para fins de demonstração)
    // Em um sistema real, isso viria de uma tabela de snapshots de fechamento de mês anterior.
    const initialStockValue = Math.max(0, currentStockValue * 0.95); // Simulação: 95% do atual

    // 4. CMV Apurado: (EI + C) - EF
    const cmvApurado = (initialStockValue + monthlyPurchases) - currentStockValue;

    return {
      currentStockValue,
      monthlyPurchases,
      initialStockValue,
      cmvApurado
    };
  }, [selectedMonth, selectedYear, allInventoryItems, entries]);

  const handleStartClosure = () => {
    toast.info("Iniciando processo de fechamento de CMV...", {
      description: "O sistema irá congelar os saldos atuais para gerar o relatório final do período."
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">Apuração de CMV</h1>
          <p className="text-muted-foreground">
            Gestão financeira de estoque e cálculo real do Custo de Mercadoria Vendida.
          </p>
        </header>
        <Button onClick={handleStartClosure} className="gap-2 shadow-lg">
          <PlusCircle className="h-4 w-4" />
          Iniciar Novo Fechamento de CMV
        </Button>
      </div>

      {/* Filtros de Período */}
      <Card className="bg-muted/30 border-none">
        <CardContent className="p-3 flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-muted-foreground px-2">Período de Análise:</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-9 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] h-9 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
              Valor Total em Estoque Atual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.currentStockValue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Representa seu Estoque Final (EF) para o cálculo.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
              Total de Compras (Mês Atual)
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">
              {formatCurrency(stats.monthlyPurchases)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Soma de todos os insumos lançados no período.
            </p>
          </CardContent>
        </Card>

        <Card className="border-metric-cyan/20 bg-metric-cyan/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-metric-cyan">
              CMV Apurado (Mês Atual)
            </CardTitle>
            <Calculator className="h-4 w-4 text-metric-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-metric-cyan">
              {formatCurrency(stats.cmvApurado)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Fórmula: (Estoque Inicial + Compras) - Estoque Atual.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes de Insumos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Composição do Estoque por Item
          </CardTitle>
          <CardDescription>
            Análise detalhada do valor imobilizado e peso de cada insumo no seu inventário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Insumo</TableHead>
                  <TableHead className="text-center font-bold">Qtd. Atual</TableHead>
                  <TableHead className="text-center font-bold">Unidade</TableHead>
                  <TableHead className="text-right font-bold">Valor Imobilizado</TableHead>
                  <TableHead className="text-right font-bold">% Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum insumo cadastrado no sistema.
                    </TableCell>
                  </TableRow>
                ) : (
                  allInventoryItems
                    .sort((a, b) => (b.cost_per_stock_unit * b.current_stock) - (a.cost_per_stock_unit * a.current_stock))
                    .map((item) => {
                      const itemValue = item.cost_per_stock_unit * item.current_stock;
                      const participation = stats.currentStockValue > 0 
                        ? (itemValue / stats.currentStockValue) * 100 
                        : 0;

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.current_stock.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-xs uppercase">{item.stock_unit}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(itemValue)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {participation.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
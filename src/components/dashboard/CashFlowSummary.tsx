import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { useCashFlow } from "@/hooks/useCashFlow";
import { parseISO, isSameMonth, isSameYear } from 'date-fns';
import { useMemo } from "react";

export function CashFlowSummary() {
  const { entries } = useCashFlow();

  const summary = useMemo(() => {
    const today = new Date();

    const currentMonthEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isSameYear(entryDate, today) && isSameMonth(entryDate, today);
    });

    const totalIncome = currentMonthEntries
      .filter(e => e.type === 'entrada' && e.status === 'efetuado')
      .reduce((sum, e) => sum + e.value, 0);
    
    const totalOutcome = currentMonthEntries
      .filter(e => e.type === 'saída' && e.status === 'efetuado')
      .reduce((sum, e) => sum + e.value, 0);
      
    const balance = totalIncome - totalOutcome;

    return { totalIncome, totalOutcome, balance };
  }, [entries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-success/20 border border-success">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-success">Entradas do Mês</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold text-success">{formatCurrency(summary.totalIncome)}</div></CardContent>
      </Card>
      <Card className="bg-destructive/20 border border-destructive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-destructive">Saídas do Mês</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalOutcome)}</div></CardContent>
      </Card>
      <Card className="bg-primary/20 border border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">Saldo do Mês</CardTitle>
          <span className="font-bold text-primary">R$</span>
        </CardHeader>
        <CardContent><div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(summary.balance)}</div></CardContent>
      </Card>
    </div>
  );
}
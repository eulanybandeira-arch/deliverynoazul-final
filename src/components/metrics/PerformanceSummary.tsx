import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/pricing";
import { TrendingUp } from "lucide-react";

interface PerformanceSummaryProps {
  monthlyIncome: number;
  monthlyGoal: number;
  remainingForGoal: number;
  requiredDailyAverage: number;
  requiredWeeklyAverage: number;
}

export function PerformanceSummary({
  monthlyIncome,
  monthlyGoal,
  remainingForGoal,
  requiredDailyAverage,
  requiredWeeklyAverage,
}: PerformanceSummaryProps) {
  const progressPercentage = monthlyGoal > 0 ? (monthlyIncome / monthlyGoal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Desempenho
        </CardTitle>
        <CardDescription>
          Acompanhamento do faturamento em relação à meta definida para o mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progresso em relação à meta mensal</span>
            <span className="text-lg font-bold text-primary">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          <div className="flex justify-between items-center mt-1 text-xs">
            <span>{formatCurrency(monthlyIncome)}</span>
            <span>{formatCurrency(monthlyGoal)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Falta para a meta</p>
            <p className="text-2xl font-bold">{formatCurrency(remainingForGoal)}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Meta diária necessária</p>
            <p className="text-2xl font-bold">{formatCurrency(requiredDailyAverage)}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Meta semanal necessária</p>
            <p className="text-2xl font-bold">{formatCurrency(requiredWeeklyAverage)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
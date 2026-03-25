import { useState, useMemo } from "react";
import { BusinessMetricsCard } from "@/components/pricing/BusinessMetricsCard";
import { PerformanceSummary } from "@/components/metrics/PerformanceSummary";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { useCashFlow } from "@/hooks/useCashFlow";
import { formatCurrency } from "@/utils/pricing";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addMonths, subMonths, isSameMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Metricas() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { metrics, loading: loadingMetrics, updateMetrics, deleteMetrics } = useBusinessMetrics();
  const { entries, loading: loadingCashFlow } = useCashFlow();

  // Calcula o faturamento real do mês baseado nas entradas do fluxo de caixa
  const monthlyIncome = useMemo(() => {
    return entries
      .filter(e => 
        e.type === 'entrada' && 
        e.status === 'efetuado' && 
        isSameMonth(parseISO(e.date), currentDate)
      )
      .reduce((sum, e) => sum + e.value, 0);
  }, [entries, currentDate]);

  // Calcula despesas do mês
  const monthlyExpenses = useMemo(() => {
    return entries
      .filter(e => 
        e.type === 'saída' && 
        e.status === 'efetuado' && 
        isSameMonth(parseISO(e.date), currentDate)
      )
      .reduce((sum, e) => sum + e.value, 0);
  }, [entries, currentDate]);

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  // Local state for pending metrics changes
  const [pendingMetrics, setPendingMetrics] = useState<{
    monthlyRevenue: number;
    workDays: number;
    workDaysPerWeek: number;
    dailyTarget: number;
    minProfitMargin: number;
  } | null>(null);

  // Check if metrics have been saved (have non-zero values)
  const hasSavedMetrics = metrics.monthly_revenue > 0 || metrics.daily_target > 0;

  const displayMetrics = pendingMetrics ?? {
    monthlyRevenue: metrics.monthly_revenue,
    workDays: metrics.work_days,
    workDaysPerWeek: metrics.work_days_per_week,
    dailyTarget: metrics.daily_target,
    minProfitMargin: metrics.min_profit_margin,
  };

  const handleMetricsChange = (newMetrics: typeof displayMetrics) => {
    // Auto-sync monthlyRevenue when dailyTarget or workDays changes
    const calculatedMonthlyRevenue = newMetrics.dailyTarget * newMetrics.workDays;
    setPendingMetrics({
      ...newMetrics,
      monthlyRevenue: calculatedMonthlyRevenue,
    });
  };

  const handleSave = async () => {
    if (!pendingMetrics) {
      toast.info("Nenhuma alteração para salvar");
      return true;
    }
    
    setIsSaving(true);
    const success = await updateMetrics({
      monthly_revenue: pendingMetrics.monthlyRevenue,
      work_days: pendingMetrics.workDays,
      work_days_per_week: pendingMetrics.workDaysPerWeek,
      daily_target: pendingMetrics.dailyTarget,
      min_profit_margin: pendingMetrics.minProfitMargin,
    });
    setIsSaving(false);
    
    if (success) {
      setPendingMetrics(null);
      setIsEditing(false);
      toast.success("Métricas salvas com sucesso");
    }
    return success;
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    setIsSaving(true);
    const success = await deleteMetrics();
    setIsSaving(false);
    if (success) {
      setPendingMetrics(null);
      setIsEditing(true); // After delete, enter edit mode for new metrics
    }
    return success;
  };

  const monthlyGoal = displayMetrics.dailyTarget * displayMetrics.workDays;
  const remainingForGoal = Math.max(0, monthlyGoal - monthlyIncome);
  
  const today = new Date();
  let remainingWorkDays = 0;
  if (isSameMonth(today, currentDate) && today < endOfMonth(currentDate)) {
    const interval = eachDayOfInterval({ start: today, end: endOfMonth(currentDate) });
    remainingWorkDays = interval.filter(day => !isWeekend(day)).length;
  } else if (currentDate > today) {
    remainingWorkDays = displayMetrics.workDays;
  }

  const requiredDailyAverage = remainingWorkDays > 0 ? remainingForGoal / remainingWorkDays : 0;
  const requiredWeeklyAverage = requiredDailyAverage * displayMetrics.workDaysPerWeek;

  if (loadingMetrics || loadingCashFlow) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">Métricas do Negócio</h1>
          <p className="text-muted-foreground">
            Acompanhe as metas e o desempenho financeiro do seu negócio.
          </p>
        </header>
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
          <Button variant="ghost" size="icon" onClick={() => handleDateChange(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold w-32 text-center capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => handleDateChange(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-metric-red/20 border border-metric-red">
          <CardHeader>
            <CardTitle className="text-metric-red">Meta Diária</CardTitle>
            <p className="text-3xl font-bold text-metric-red">{formatCurrency(displayMetrics.dailyTarget)}</p>
          </CardHeader>
        </Card>
        <Card className="bg-metric-cyan/20 border border-metric-cyan">
          <CardHeader>
            <CardTitle className="text-metric-cyan">Meta Semanal</CardTitle>
            <p className="text-3xl font-bold text-metric-cyan">{formatCurrency(displayMetrics.dailyTarget * displayMetrics.workDaysPerWeek)}</p>
          </CardHeader>
        </Card>
        <Card className="bg-metric-gold/20 border border-metric-gold">
          <CardHeader>
            <CardTitle className="text-metric-gold">Meta Mensal</CardTitle>
            <p className="text-3xl font-bold text-metric-gold">{formatCurrency(displayMetrics.dailyTarget * displayMetrics.workDays)}</p>
          </CardHeader>
        </Card>
      </div>

      <PerformanceSummary
        monthlyIncome={monthlyIncome}
        monthlyGoal={monthlyGoal}
        remainingForGoal={remainingForGoal}
        requiredDailyAverage={requiredDailyAverage}
        requiredWeeklyAverage={requiredWeeklyAverage}
      />

      <BusinessMetricsCard
        metrics={displayMetrics}
        onUpdate={handleMetricsChange}
        onSave={handleSave}
        onDelete={handleDelete}
        totalExpenses={monthlyExpenses}
        isSaving={isSaving}
        isEditing={isEditing || !hasSavedMetrics}
        onStartEditing={handleStartEditing}
      />
    </div>
  );
}

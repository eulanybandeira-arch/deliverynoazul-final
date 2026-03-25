import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Target, Save, Trash2, Loader2, Pencil } from "lucide-react";
import { BusinessMetrics } from "@/types/pricing";
import { getExpenseStatus } from "@/utils/pricing";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Feriados Nacionais do Brasil (exemplo para 2024 e 2025)
const holidays = [
  new Date(2024, 0, 1), new Date(2024, 1, 12), new Date(2024, 1, 13), new Date(2024, 2, 29), 
  new Date(2024, 3, 21), new Date(2024, 4, 1), new Date(2024, 4, 30), new Date(2024, 8, 7), 
  new Date(2024, 9, 12), new Date(2024, 10, 2), new Date(2024, 10, 15), new Date(2024, 11, 25),
  new Date(2025, 0, 1), new Date(2025, 2, 3), new Date(2025, 2, 4), new Date(2025, 3, 18),
  new Date(2025, 3, 21), new Date(2025, 4, 1), new Date(2025, 5, 19), new Date(2025, 8, 7),
  new Date(2025, 9, 12), new Date(2025, 10, 2), new Date(2025, 10, 15), new Date(2025, 11, 25),
];

interface BusinessMetricsCardProps {
  metrics: BusinessMetrics;
  onUpdate: (metrics: BusinessMetrics) => void;
  onSave?: () => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
  totalExpenses: number;
  isSaving?: boolean;
  isEditing?: boolean;
  onStartEditing?: () => void;
}

export function BusinessMetricsCard({ metrics, onUpdate, onSave, onDelete, totalExpenses, isSaving, isEditing = true, onStartEditing }: BusinessMetricsCardProps) {
  const expensePercentage = metrics.monthlyRevenue > 0 ? (totalExpenses / metrics.monthlyRevenue) * 100 : 0;
  const expenseStatus = getExpenseStatus(expensePercentage);

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Performance
          </CardTitle>
          <CardDescription>Defina e acompanhe suas metas de faturamento</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {onSave && (
                <Button onClick={onSave} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </>
                  )}
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isSaving}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Métricas</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir todas as métricas de negócio? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            onStartEditing && (
              <Button onClick={onStartEditing} size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dailyTarget">Meta Diária de Faturamento (R$)</Label>
            <Input
              id="dailyTarget"
              type="text"
              value={metrics.dailyTarget === 0 ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.dailyTarget)}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, "");
                const numeric = parseInt(numbers || "0") / 100;
                onUpdate({ ...metrics, dailyTarget: numeric });
              }}
              placeholder="R$ 0,00"
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workDaysPerWeek">Dias Trabalhados/Semana</Label>
            <Input
              id="workDaysPerWeek"
              type="number"
              min="1"
              max="7"
              value={metrics.workDaysPerWeek === 0 ? '' : metrics.workDaysPerWeek}
              onChange={(e) => onUpdate({ ...metrics, workDaysPerWeek: Number(e.target.value) || 0 })}
              placeholder="0"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workDays">Dias Úteis/Mês</Label>
            <div className="flex items-center gap-2">
              <Input
                id="workDays"
                type="number"
                value={metrics.workDays === 0 ? '' : metrics.workDays}
                onChange={(e) => onUpdate({ ...metrics, workDays: Number(e.target.value) || 0 })}
                className="flex-1"
                placeholder="0"
                disabled={!isEditing}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    modifiers={{ holidays }}
                    modifiersStyles={{ holidays: { color: 'hsl(var(--primary))', fontWeight: 'bold' } }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyRevenue">Faturamento Mensal Médio</Label>
            <Input
              id="monthlyRevenue"
              type="text"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.workDays * metrics.dailyTarget)}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Calculado: Dias Úteis × Meta Diária</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minProfitMargin">Meta Mínima de Lucro (%)</Label>
            <Input
              id="minProfitMargin"
              type="number"
              min="0"
              max="100"
              step="1"
              value={metrics.minProfitMargin === 0 ? '' : metrics.minProfitMargin}
              onChange={(e) => onUpdate({ ...metrics, minProfitMargin: Number(e.target.value) || 0 })}
              placeholder="30"
              disabled={!isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Receberá alertas quando a margem de lucro de uma receita cair abaixo deste valor.
            </p>
          </div>
        </div>

        <Card className={`border-2 ${
          expensePercentage > 33 ? "border-destructive" : 
          expensePercentage > 30 ? "border-warning" : 
          "border-success"
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Despesas Operacionais</CardTitle>
            <CardDescription className="pt-2 text-sm">
              Acima de 33% de custo de operação, o risco de operar no vermelho aumenta. Mantenha esse percentual abaixo de 30% para garantir uma operação saudável.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Percentual do Faturamento</p>
                <p className={`text-3xl font-bold ${
                  expensePercentage > 33 ? "text-destructive" : 
                  expensePercentage > 30 ? "text-warning" : 
                  "text-success"
                }`}>
                  {expensePercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{expenseStatus.icon}</span>
                  <span className={`text-lg font-semibold ${
                    expensePercentage > 33 ? "text-destructive" : 
                    expensePercentage > 30 ? "text-warning" : 
                    "text-success"
                  }`}>
                    {expenseStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
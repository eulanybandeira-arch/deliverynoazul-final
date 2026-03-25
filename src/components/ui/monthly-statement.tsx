import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatementEntry {
  id: string;
  date: string;
  description: string;
  value: number;
  type: "entrada" | "saída";
}

interface MonthlyStatementProps {
  entries: StatementEntry[];
  title?: string;
  onMonthChange?: (date: Date) => void;
}

export function MonthlyStatement({ entries, title = "Extrato Mensal", onMonthChange }: MonthlyStatementProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= monthStart && entryDate <= monthEnd;
  });

  const entriesByDay = daysInMonth.reduce((acc, day) => {
    const dayEntries = filteredEntries.filter((entry) => 
      isSameDay(new Date(entry.date), day)
    );
    if (dayEntries.length > 0) {
      acc[format(day, "yyyy-MM-dd")] = dayEntries;
    }
    return acc;
  }, {} as Record<string, StatementEntry[]>);

  const totalEntradas = filteredEntries
    .filter((e) => e.type === "entrada")
    .reduce((sum, e) => sum + e.value, 0);

  const totalSaidas = filteredEntries
    .filter((e) => e.type === "saída")
    .reduce((sum, e) => sum + e.value, 0);

  const saldo = totalEntradas - totalSaidas;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-sm font-semibold text-green-600">
              {totalEntradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-sm font-semibold text-red-600">
              {totalSaidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={cn("text-sm font-semibold", saldo >= 0 ? "text-green-600" : "text-red-600")}>
              {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
        </div>

        {/* Lista de entradas por dia */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {Object.keys(entriesByDay).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro neste mês
            </p>
          ) : (
            Object.entries(entriesByDay)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, dayEntries]) => (
                <div key={dateKey} className="border-b border-border/50 pb-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {format(new Date(dateKey), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1 px-2 hover:bg-muted/30 rounded">
                      <span className="text-sm truncate flex-1">{entry.description}</span>
                      <span className={cn(
                        "text-sm font-medium ml-2",
                        entry.type === "entrada" ? "text-green-600" : "text-red-600"
                      )}>
                        {entry.type === "entrada" ? "+" : "-"}
                        {entry.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

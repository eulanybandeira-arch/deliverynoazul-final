import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesTable } from "@/components/pricing/ExpensesTable";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { useState, useEffect } from "react";
import { Expense } from "@/types/pricing";
import { formatCurrency } from "@/utils/pricing";
import { useCashFlow } from "@/hooks/useCashFlow";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Analise() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { addEntry } = useCashFlow();

  // TODO: In the future, expenses should be stored in Supabase per recipe
  // For now, keeping them in local state only (not persisted)

  const total = expenses.reduce((sum, exp) => sum + exp.value, 0);

  const updateExpense = (index: number, field: keyof Expense, value: any) => {
    setExpenses(prev => prev.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const addExpense = () => {
    setExpenses([...expenses, { name: "", value: 0, dueDate: "", attachmentUrl: "" }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handlePostToCashFlow = async (index: number) => {
    const expense = expenses[index];
    if (!expense.name || expense.value <= 0) {
      toast.error("Preencha o nome e o valor da despesa antes de lançar.");
      return;
    }

    await addEntry({
      date: new Date().toISOString().split('T')[0],
      description: `Pagamento: ${expense.name}`,
      value: expense.value,
      type: 'saída',
      category: 'despesas_fixas',
      status: 'efetuado',
      location: 'conta_corrente',
    });
    toast.success(`Despesa "${expense.name}" lançada no Fluxo de Caixa.`);

    // Marcar como paga no mês atual
    const currentMonth = format(new Date(), "yyyy-MM");
    const updatedExpenses = expenses.map((exp, i) => {
      if (i === index) {
        return { ...exp, lastPaid: currentMonth };
      }
      return exp;
    });
    setExpenses(updatedExpenses);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary dark:text-foreground">Despesas Fixas Mensais</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Lançamento de Despesas
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              <Button onClick={addExpense} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Despesa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExpensesTable
            expenses={expenses}
            onUpdate={updateExpense}
            onRemove={removeExpense}
            onPostToCashFlow={handlePostToCashFlow}
          />
        </CardContent>
      </Card>
    </div>
  );
}
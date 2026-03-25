import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, FileText, Loader2, Landmark, Check } from "lucide-react";
import { Expense } from "@/types/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpensesTableProps {
  expenses: Expense[];
  onUpdate: (index: number, field: keyof Expense, value: any) => void;
  onRemove?: (index: number) => void;
  onPostToCashFlow?: (index: number) => void;
}

export function ExpensesTable({ expenses, onUpdate, onRemove, onPostToCashFlow }: ExpensesTableProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const currentMonth = format(new Date(), "yyyy-MM");

  const handleFileUpload = async (file: File, index: number) => {
    if (!file) return;
    setUploadingIndex(index);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error } = await supabase.storage
      .from('invoices')
      .upload(filePath, file);

    if (error) {
      toast.error("Falha no upload.", { description: "Verifique se o bucket 'invoices' existe e tem as permissões corretas." });
      setUploadingIndex(null);
      return;
    }

    const { data } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath);

    if (data.publicUrl) {
      onUpdate(index, 'attachmentUrl', data.publicUrl);
      toast.success("Anexo enviado com sucesso!");
    } else {
      toast.error("Não foi possível obter a URL do anexo.");
    }
    setUploadingIndex(null);
  };

  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => {
        const isPaid = expense.lastPaid === currentMonth;
        return (
          <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor={`expense-name-${index}`}>Nome</Label>
              <Input
                id={`expense-name-${index}`}
                placeholder="Ex: Aluguel"
                value={expense.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`expense-value-${index}`}>Valor</Label>
              <Input
                id={`expense-value-${index}`}
                type="text"
                placeholder="R$ 0,00"
                value={expense.value === 0 ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value)}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, "");
                  const numeric = parseInt(numbers || "0") / 100;
                  onUpdate(index, 'value', numeric);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`expense-date-${index}`}>Vencimento</Label>
              <Input
                id={`expense-date-${index}`}
                type="date"
                value={expense.dueDate}
                onChange={(e) => onUpdate(index, 'dueDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Anexo</Label>
              {expense.attachmentUrl ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={expense.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Anexo
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <label htmlFor={`attachment-${index}`} className="cursor-pointer flex items-center justify-center">
                    {uploadingIndex === index ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadingIndex === index ? "Enviando..." : "Enviar"}
                    <input
                      id={`attachment-${index}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], index)}
                      disabled={uploadingIndex === index}
                    />
                  </label>
                </Button>
              )}
            </div>
            {onPostToCashFlow && (
              isPaid ? (
                <Button variant="outline" size="icon" disabled className="text-green-500 border-green-500">
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPostToCashFlow(index)}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Landmark className="h-4 w-4" />
                </Button>
              )
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
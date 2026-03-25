import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { CashFlowEntry, STATUS_OPTIONS, LOCATION_OPTIONS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/types/cashflow";
import { formatCurrency } from "@/utils/pricing";
import { format } from "date-fns";

interface CashFlowTableProps {
  entries: CashFlowEntry[];
  onDelete: (id: string) => void;
}

export function CashFlowTable({ entries, onDelete }: CashFlowTableProps) {
  const getCategoryLabel = (entry: CashFlowEntry) => {
    const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    return allCategories.find(c => c.value === entry.category)?.label || entry.category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamentos do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lançamento neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), "dd/MM/yy")}</TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'entrada' ? 'default' : 'destructive'} className={entry.type === 'entrada' ? 'bg-primary' : ''}>
                        {entry.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCategoryLabel(entry)}</TableCell>
                    <TableCell>{STATUS_OPTIONS.find(s => s.value === entry.status)?.label}</TableCell>
                    <TableCell>{LOCATION_OPTIONS.find(l => l.value === entry.location)?.label}</TableCell>
                    <TableCell className={`text-right font-semibold ${entry.type === 'entrada' ? 'text-primary' : 'text-destructive'}`}>
                      {formatCurrency(entry.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
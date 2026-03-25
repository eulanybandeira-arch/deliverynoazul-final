import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, FileText, Image as ImageIcon } from "lucide-react";
import { EquipmentItem } from "@/types/equipment";
import { formatCurrency } from "@/utils/pricing";

interface EquipmentTableProps {
  items: EquipmentItem[];
  onDelete: (id: string) => void;
  onEdit: (item: EquipmentItem) => void;
}

export function EquipmentTable({ items, onDelete, onEdit }: EquipmentTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString.replace(/-/g, '\/'));
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum equipamento cadastrado.
        </p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data da Compra</TableHead>
                <TableHead>Anexos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatCurrency(item.purchase_value)}</TableCell>
                  <TableCell>{formatDate(item.purchase_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.invoice_url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={item.invoice_url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /></a>
                        </Button>
                      )}
                      {item.photo_url && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={item.photo_url} target="_blank" rel="noopener noreferrer"><ImageIcon className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
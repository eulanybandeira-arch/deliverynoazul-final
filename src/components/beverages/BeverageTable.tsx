import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { BeverageItem } from "@/types/beverage";
import { formatCurrency, formatQuantity } from "@/utils/pricing";
import { Badge } from "@/components/ui/badge";

interface BeverageTableProps {
  items: BeverageItem[];
  onDelete: (id: string) => void;
  onEdit: (item: BeverageItem) => void;
}

export function BeverageTable({ items, onDelete, onEdit }: BeverageTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString.replace(/-/g, '\/'));
    return date.toLocaleDateString('pt-BR');
  };

  const isLowStock = (item: BeverageItem) => {
    return item.current_stock <= item.min_alert_level;
  };

  return (
    <>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum item cadastrado
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Nível Mínimo</TableHead>
                <TableHead>Custo Unitário</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={isLowStock(item) ? "bg-metric-orange/10" : ""}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Badge variant={isLowStock(item) ? "destructive" : "secondary"} className="w-20 justify-center shrink-0">
                      {formatQuantity(item.quantity_purchased, item.purchase_unit)}
                    </Badge>
                    <span>{item.name} {item.brand && `(${item.brand})`}</span>
                  </TableCell>
                  <TableCell>{formatQuantity(item.current_stock, item.purchase_unit)}</TableCell>
                  <TableCell>{formatQuantity(item.min_alert_level, item.purchase_unit)}</TableCell>
                  <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                  <TableCell>{formatDate(item.expiry_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item.id)}
                    >
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

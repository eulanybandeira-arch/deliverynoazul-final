import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDown, ArrowUp, RefreshCw, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockMovements, StockMovement } from "@/hooks/useStockMovements";
import { Skeleton } from "@/components/ui/skeleton";

interface StockMovementsHistoryProps {
  inventoryItemId?: string;
  title?: string;
  limit?: number;
}

const movementTypeConfig = {
  venda: { label: "Venda", icon: ArrowDown, color: "destructive" as const },
  compra: { label: "Compra", icon: ArrowUp, color: "default" as const },
  ajuste: { label: "Ajuste", icon: RefreshCw, color: "secondary" as const },
};

export function StockMovementsHistory({ 
  inventoryItemId, 
  title = "Histórico de Movimentações",
  limit 
}: StockMovementsHistoryProps) {
  const { movements, loading } = useStockMovements(inventoryItemId);
  
  const displayMovements = limit ? movements.slice(0, limit) : movements;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayMovements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma movimentação registrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              {!inventoryItemId && <TableHead>Item</TableHead>}
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Estoque Anterior</TableHead>
              <TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead>Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayMovements.map((movement) => {
              const config = movementTypeConfig[movement.movement_type];
              const Icon = config.icon;
              
              return (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(parseISO(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  {!inventoryItemId && (
                    <TableCell className="font-medium">
                      {movement.inventory_item?.name || "-"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={config.color} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {movement.movement_type === 'venda' ? '-' : '+'}
                    {movement.quantity.toFixed(2)} {movement.inventory_item?.stock_unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {movement.previous_stock.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {movement.new_stock.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.recipe_name || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

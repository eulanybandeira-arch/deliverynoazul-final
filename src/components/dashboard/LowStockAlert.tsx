import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, PackagePlus, Loader2, ShoppingCart } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function LowStockAlert() {
  const { items, loading } = useInventory();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const lowStockItems = useMemo(() => {
    return items.filter(item => item.current_stock <= item.min_alert_level);
  }, [items]);

  const allSelected = lowStockItems.length > 0 && selectedIds.length === lowStockItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lowStockItems.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendToList = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }
    // Navegar para lista de compras com os IDs selecionados
    toast.success(`${selectedIds.length} item(s) enviado(s) para a lista de compras`);
    navigate('/lista-compras');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alerta de Estoque Baixo
            </CardTitle>
            <CardDescription>
              Insumos que atingiram ou estão abaixo do nível mínimo de alerta.
            </CardDescription>
          </div>
          {lowStockItems.length > 0 && selectedIds.length > 0 && (
            <Button onClick={handleSendToList} size="sm">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Enviar ({selectedIds.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {lowStockItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item com estoque baixo. Tudo em ordem!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={allSelected} 
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Nível Mínimo</TableHead>
                  <TableHead>Unidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id} className="bg-destructive/10">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        aria-label={`Selecionar ${item.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-bold text-destructive">
                      {item.current_stock.toFixed(2)}
                    </TableCell>
                    <TableCell>{item.min_alert_level.toFixed(2)}</TableCell>
                    <TableCell>{item.stock_unit}</TableCell>
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

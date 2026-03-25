import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Box, ChevronsUpDown } from "lucide-react";
import { Packaging, UNIT_OPTIONS } from "@/types/pricing";
import { InventoryItem } from "@/types/inventory";
import { formatCurrency } from "@/utils/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InventoryItemSelector } from "../inventory/InventoryItemSelector";

interface PackagingTableProps {
  packaging: Packaging[];
  inventoryItems: InventoryItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Packaging, value: any) => void;
  onUpdateFromInventory: (id: string, item: InventoryItem) => void;
}

export function PackagingTable({ packaging, inventoryItems, onAdd, onRemove, onUpdate, onUpdateFromInventory }: PackagingTableProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();
  const packagingItems = inventoryItems.filter(item => item.category_logistics === 'embalagens_utensilios');

  const getUnitLabel = (unitValue: string) => {
    const option = UNIT_OPTIONS.find(o => o.value === unitValue);
    return option ? option.label : unitValue;
  };

  return (
    <>
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                Embalagens
              </CardTitle>
              <CardDescription>Custos de embalagem do produto</CardDescription>
            </div>
            <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
            <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_1fr_auto] gap-2 mb-2 px-3 text-sm font-semibold text-muted-foreground">
              <div>Embalagens</div>
              <div>Conteúdo Unitário</div>
              <div>Unidade</div>
              <div>Valor do Pacote</div>
              <div>Qtd. Utilizada</div>
              <div>Custo Utilizado</div>
              <div className="w-10"></div>
            </div>
            <div className="space-y-2">
              {packaging.map((pkg) => {
                const linkedItem = pkg.inventoryItemId
                  ? inventoryItems.find((i) => i.id === pkg.inventoryItemId)
                  : undefined;

                return (
                  <div key={pkg.id} className="group grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_1fr_auto] gap-2 p-3 bg-accent/50 rounded-lg items-center transition-colors duration-200 hover:bg-green-500/10 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-green-500/10">
                    {packagingItems.length > 0 ? (
                      <InventoryItemSelector
                        items={packagingItems}
                        selectedItemId={pkg.inventoryItemId}
                        onSelect={(item) => onUpdateFromInventory(pkg.id, item)}
                        placeholder="Selecione uma embalagem"
                      />
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-transparent border-0"
                        onClick={() => setIsAlertOpen(true)}
                      >
                        <span className="truncate">Cadastre uma embalagem</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    )}

                    {pkg.inventoryItemId ? (
                      <div className="px-3 py-2 text-sm text-foreground bg-muted/50 rounded">
                        {linkedItem?.conversion_factor || pkg.packageQty}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="0"
                        value={pkg.packageQty === 0 ? '' : pkg.packageQty}
                        min="0"
                        onChange={(e) => onUpdate(pkg.id, 'packageQty', Number(e.target.value) || 0)}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    )}
                  {pkg.inventoryItemId ? (
                    <div className="px-3 py-2 text-sm text-foreground">
                      {getUnitLabel(pkg.unit)}
                    </div>
                  ) : (
                    <Select
                      value={pkg.unit}
                      onValueChange={(value) => onUpdate(pkg.id, 'unit', value)}
                    >
                      <SelectTrigger className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {pkg.inventoryItemId ? (
                    <div className="px-3 py-2 text-sm text-foreground bg-muted/50 rounded">
                      {formatCurrency(pkg.packagePrice)}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      placeholder="R$ 0,00"
                      value={pkg.packagePrice === 0 ? '' : formatCurrency(pkg.packagePrice)}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        const numeric = parseInt(numbers || "0") / 100;
                        onUpdate(pkg.id, 'packagePrice', numeric);
                      }}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  )}
                  <Input
                    type="number"
                    placeholder="0"
                    value={pkg.usedQty === 0 ? '' : pkg.usedQty}
                    min="0"
                    onChange={(e) => onUpdate(pkg.id, 'usedQty', Number(e.target.value) || 0)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Input
                    value={formatCurrency(pkg.usedValue)}
                    disabled
                    className="border-0 bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(pkg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nenhuma Embalagem Cadastrada</AlertDialogTitle>
            <AlertDialogDescription>
              Adicione um item do tipo 'Embalagem' no Controle de Compras e Estoque para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/insumos')}>
              Adicionar Insumo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
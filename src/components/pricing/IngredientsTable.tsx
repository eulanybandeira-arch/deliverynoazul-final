import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package, ChevronsUpDown } from "lucide-react";
import { Ingredient, UNIT_OPTIONS } from "@/types/pricing";
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

interface IngredientsTableProps {
  ingredients: Ingredient[];
  inventoryItems: InventoryItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Ingredient, value: any) => void;
  onUpdateFromInventory: (id: string, item: InventoryItem) => void;
}

export function IngredientsTable({ ingredients, inventoryItems, onAdd, onRemove, onUpdate, onUpdateFromInventory }: IngredientsTableProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();
  const ingredientItems = inventoryItems.filter(item => item.category_logistics !== 'embalagens');

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
                <Package className="h-5 w-5 text-primary" />
                Ingredientes
              </CardTitle>
              <CardDescription>Adicione os ingredientes e quantidades utilizadas</CardDescription>
            </div>
            <Button onClick={onAdd} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.8fr_1fr_auto] gap-2 mb-2 px-3 text-sm font-semibold text-muted-foreground">
              <div>Ingredientes</div>
              <div>Qtd. Pacote</div>
              <div>Unidade</div>
              <div>Valor Pago</div>
              <div>Qtd. Utilizada</div>
              <div>Unidade</div>
              <div>Custo Utilizado</div>
              <div className="w-10"></div>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="group grid grid-cols-[2fr_1fr_0.8fr_1fr_1fr_0.8fr_1fr_auto] gap-2 p-3 bg-accent/50 rounded-lg items-center transition-colors duration-200 hover:bg-green-500/10 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-green-500/10"
                >
                  {ingredientItems.length > 0 ? (
                    <InventoryItemSelector
                      items={ingredientItems}
                      selectedItemId={ingredient.inventoryItemId}
                      onSelect={(item) => onUpdateFromInventory(ingredient.id, item)}
                      placeholder={ingredient.name || "Selecione um insumo"}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-transparent border-0"
                      onClick={() => setIsAlertOpen(true)}
                    >
                      <span className="truncate">{ingredient.name || "Cadastre um insumo"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  )}
                  <Input
                    type="number"
                    placeholder="0"
                    value={ingredient.packageQty === 0 ? '' : ingredient.packageQty}
                    min="0"
                    onChange={(e) => onUpdate(ingredient.id, 'packageQty', Number(e.target.value) || 0)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Select
                    value={ingredient.unit}
                    onValueChange={(value) => onUpdate(ingredient.id, 'unit', value)}
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
                  <Input
                    type="text"
                    placeholder="R$ 0,00"
                    value={ingredient.unitPrice === 0 ? '' : formatCurrency(ingredient.unitPrice)}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      const numeric = parseInt(numbers || "0") / 100;
                      onUpdate(ingredient.id, 'unitPrice', numeric);
                    }}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Input
                    type="number"
                    placeholder="0"
                    value={ingredient.usedQty === 0 ? '' : ingredient.usedQty}
                    min="0"
                    onChange={(e) => onUpdate(ingredient.id, 'usedQty', Number(e.target.value) || 0)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Select
                    value={ingredient.usedUnit || ingredient.unit}
                    onValueChange={(value) => onUpdate(ingredient.id, 'usedUnit', value)}
                  >
                    <SelectTrigger className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={`used-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formatCurrency(ingredient.usedValue)}
                    disabled
                    className="border-0 bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(ingredient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nenhum Insumo Cadastrado</AlertDialogTitle>
            <AlertDialogDescription>
              Adicione um item no Controle de Compras e Estoque para continuar.
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
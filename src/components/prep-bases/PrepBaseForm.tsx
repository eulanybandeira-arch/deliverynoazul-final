import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2 } from "lucide-react";
import { usePrepBases } from "@/hooks/usePrepBases";
import { useInventory, type InventoryItem } from "@/hooks/useInventory";
import { PREP_BASE_CATEGORIES, PREP_BASE_UNITS } from "@/types/prep-base";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface IngredientRow {
  name: string;
  inventory_item_id: string | null;
  used_qty: number;
  used_unit: string;
  unit: string;
  package_qty: number;
  unit_price: number;
  loss: number | null;
  usedValue: number;
}

export function PrepBaseForm({ open, onClose }: Props) {
  const { createPrepBase } = usePrepBases();
  const { items: inventoryItems } = useInventory();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Base");
  const [yieldUnit, setYieldUnit] = useState("Kg");
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(7);

  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState(0);
  const [addUnit, setAddUnit] = useState("g");
  const [addCost, setAddCost] = useState(0);
  const [yieldAmount, setYieldAmount] = useState(0);

  const totalCost = ingredients.reduce((s, i) => s + i.usedValue, 0);
  const unitCost = yieldAmount > 0 ? totalCost / yieldAmount : 0;

  const filteredInventory = inventoryItems.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleSelectInventoryItem = (item: InventoryItem) => {
    setSelectedInventory(item);
    setSearchItem(item.name);
    setAddUnit(item.stock_unit || item.unit || "g");
    setAddCost(item.unit_cost || 0);
  };

  const handleAddIngredient = () => {
    if (!searchItem || addQty <= 0) { toast.error("Informe o item e a quantidade."); return; }
    let usedValue = 0;
    if (selectedInventory) {
      const costPerUE = selectedInventory.cost_per_stock_unit || (selectedInventory.unit_cost / (selectedInventory.conversion_factor || 1));
      usedValue = addQty * costPerUE;
    } else { usedValue = addCost; }
    setIngredients((prev) => [...prev, {
      name: searchItem,
      inventory_item_id: selectedInventory?.id || null,
      used_qty: addQty,
      used_unit: addUnit,
      unit: selectedInventory?.stock_unit || addUnit,
      package_qty: selectedInventory?.conversion_factor || 1,
      unit_price: selectedInventory?.unit_cost || addCost,
      loss: selectedInventory?.loss || null,
      usedValue,
    }]);
    setSearchItem(""); setSelectedInventory(null); setAddQty(0);
  };

  const handleSave = async () => {
    if (!name || yieldAmount <= 0) { toast.error("Preencha o nome e o rendimento."); return; }
    const result = await createPrepBase(
      { name, description: description || null, category: category || null, photo_url: null, shelf_life_days: shelfLifeDays, yield_amount: yieldAmount, yield_unit: yieldUnit, total_cost: totalCost, unit_cost: unitCost, instructions: null },
      ingredients.map((ing) => ({ name: ing.name, inventory_item_id: ing.inventory_item_id, used_qty: ing.used_qty, used_unit: ing.used_unit, unit: ing.unit, package_qty: ing.package_qty, unit_price: ing.unit_price, loss: ing.loss }))
    );
    if (result) { onClose(); setStep(1); setIngredients([]); setName(""); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Cadastro de Receita (Base de Preparo)</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-4">
            <div><Label>Nome da Receita</Label><Input placeholder="Ex: Molho Especial" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PREP_BASE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Unidade de Medida</Label><Select value={yieldUnit} onValueChange={setYieldUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PREP_BASE_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Validade (Dias)</Label><Input type="number" value={shelfLifeDays} onChange={(e) => setShelfLifeDays(Number(e.target.value))} /></div>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!name}>Próximo</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
              <Label className="text-xs font-bold uppercase">Adicionar Insumo</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar no estoque..." className="pl-8" value={searchItem} onChange={(e) => { setSearchItem(e.target.value); setSelectedInventory(null); }} />
                {searchItem && !selectedInventory && filteredInventory.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredInventory.map((inv) => <button key={inv.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => handleSelectInventoryItem(inv)}>{inv.name}</button>)}
                  </div>
                )}
              </div>
              <div className="flex gap-2"><Input type="number" placeholder="Qtd" value={addQty || ""} onChange={(e) => setAddQty(Number(e.target.value))} /><Button onClick={handleAddIngredient} size="icon"><Plus className="h-4 w-4" /></Button></div>
            </div>
            <div className="space-y-2">{ingredients.map((ing, idx) => <div key={idx} className="flex justify-between items-center p-2 border-b text-sm"><span>{ing.name} ({ing.used_qty}{ing.used_unit})</span><div className="flex items-center gap-3"><span className="font-medium">R$ {ing.usedValue.toFixed(2)}</span><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>
            <div><Label>Quanto essa receita rende pronta?</Label><div className="flex items-center gap-2"><Input type="number" value={yieldAmount || ""} onChange={(e) => setYieldAmount(Number(e.target.value))} className="w-32" /><span className="text-sm font-bold">{yieldUnit}</span></div></div>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button><Button className="flex-1" onClick={() => setStep(3)} disabled={ingredients.length === 0 || yieldAmount <= 0}>Próximo</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20"><CardContent className="pt-6 space-y-4"><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Custo Total Insumos:</span><span className="font-bold">R$ {totalCost.toFixed(2)}</span></div><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Rendimento Final:</span><span className="font-bold">{yieldAmount} {yieldUnit}</span></div><div className="flex justify-between text-lg"><span className="text-primary font-bold">Custo por {yieldUnit}:</span><span className="text-primary font-black">R$ {unitCost.toFixed(2)}</span></div></CardContent></Card>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button><Button className="flex-1" onClick={handleSave}>Salvar Receita</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
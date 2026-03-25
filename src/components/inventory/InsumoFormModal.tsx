import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info, Save, X, PlusCircle, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { Insumo } from "./InsumoTable";
import { useSuppliers } from "@/hooks/useSuppliers";

const CATEGORIES = [
  "Carnes", "Frangos", "Peixes e Frutos do Mar", "Laticínios", 
  "Hortifruti", "Secos e Mercearia", "Grãos", "Embalagens", 
  "Bebidas", "Limpeza", "Outros"
];

const UNITS = [
  "kg", "g", "L", "ml", "un", "cx", "pct", "lata", 
  "garrafa", "bdj", "saco", "fardo", "galão", "balde"
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (insumo: Partial<Insumo>, addAnother?: boolean) => void;
  editingInsumo: Insumo | null;
}

export function InsumoFormModal({ open, onOpenChange, onSave, editingInsumo }: Props) {
  const { suppliers } = useSuppliers();
  const [formData, setFormData] = useState<Partial<Insumo>>({
    name: "",
    category: "",
    purchaseUnit: "",
    stockUnit: "",
    yieldFactor: 100,
    avgCostUE: 0,
    isActiveCMV: true,
  });

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [conversionQty, setConversionQty] = useState<number>(1);

  useEffect(() => {
    if (editingInsumo) {
      setFormData(editingInsumo);
      // Mock: Insumos existentes começam com alguns fornecedores vinculados
      setSelectedSuppliers(["s1", "s2"]);
    } else {
      setFormData({
        name: "",
        category: "",
        purchaseUnit: "cx",
        stockUnit: "kg",
        yieldFactor: 100,
        avgCostUE: 0,
        isActiveCMV: true,
      });
      setSelectedSuppliers([]);
    }
  }, [editingInsumo, open]);

  const handleToggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = (addAnother: boolean = false) => {
    onSave({ ...formData }, addAnother);
    if (addAnother) {
      setFormData({
        name: "",
        category: "",
        purchaseUnit: "cx",
        stockUnit: "kg",
        yieldFactor: 100,
        avgCostUE: 0,
        isActiveCMV: true,
      });
      setSelectedSuppliers([]);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingInsumo ? "Editar Insumo" : "Cadastrar Novo Insumo"}
          </DialogTitle>
          <DialogDescription>
            Configure as unidades e fornecedores para precisão total na gestão.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Insumo</Label>
              <Input 
                id="name" 
                placeholder="Ex: Filé de Frango" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Fornecedores Vinculados */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <Label className="text-xs uppercase font-bold text-primary">Fornecedores Vinculados</Label>
            </div>
            
            <div className="space-y-3">
              <Select onValueChange={handleToggleSupplier}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar fornecedores..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id} disabled={selectedSuppliers.includes(s.id)}>
                      {s.name} ({s.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2">
                {selectedSuppliers.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Nenhum fornecedor vinculado.</span>
                ) : (
                  selectedSuppliers.map(id => {
                    const s = suppliers.find(sup => sup.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1.5 py-1 px-2 bg-background border-border/50">
                        {s?.name}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                          onClick={() => handleToggleSupplier(id)}
                        />
                      </Badge>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Vincule os fornecedores que vendem este item para poder gerar listas de compras separadas por loja.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Mecânica de Conversão e Medidas</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold">Un. Compra</Label>
                <Select 
                  value={formData.purchaseUnit} 
                  onValueChange={(v) => setFormData({ ...formData, purchaseUnit: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Ex: cx" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold">Qtd. na Compra</Label>
                <Input 
                  type="number" 
                  className="bg-background"
                  value={conversionQty}
                  onChange={(e) => setConversionQty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold">Un. Medida (Estoque)</Label>
                <Select 
                  value={formData.stockUnit} 
                  onValueChange={(v) => setFormData({ ...formData, stockUnit: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Ex: kg" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="yield">Fator de Rendimento (%)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Quanto sobra do item após a limpeza/preparo. Ex: Carne limpa (85%).
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                id="yield"
                type="number" 
                value={formData.yieldFactor}
                onChange={(e) => setFormData({ ...formData, yieldFactor: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-primary/5 border-primary/20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-bold">Ocultar do CMV</Label>
                </div>
                <p className="text-[10px] text-muted-foreground">Não afetará as margens.</p>
              </div>
              <Switch 
                checked={!formData.isActiveCMV}
                onCheckedChange={(checked) => setFormData({ ...formData, isActiveCMV: !checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:mr-auto">
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => handleSave(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Salvar e Adicionar Outro
          </Button>
          <Button onClick={() => handleSave(false)} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Insumo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
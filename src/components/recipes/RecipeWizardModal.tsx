import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ChevronRight, ChevronLeft, Save, CheckCircle2, Info } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";

interface IngredientRow {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface RecipeWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recipeData: any) => void;
}

export function RecipeWizardModal({ open, onOpenChange, onSave }: RecipeWizardModalProps) {
  const [step, setStep] = useState(1);
  const { items: inventoryItems } = useInventory();

  // Step 1 State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [salesVolume, setSalesVolume] = useState("Alta Venda");

  // Step 2 State
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [addQty, setAddQty] = useState("");
  const [recipeYield, setRecipeYield] = useState("1");

  // Step 3 State
  const [instructions, setInstructions] = useState("");

  // Calculations
  const totalCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  }, [ingredients]);

  const unitCost = useMemo(() => {
    const y = parseFloat(recipeYield) || 1;
    return totalCost / y;
  }, [totalCost, recipeYield]);

  const cmv = useMemo(() => {
    const p = parseFloat(price.replace(/\D/g, "")) / 100 || 0;
    return p > 0 ? (unitCost / p) * 100 : 0;
  }, [unitCost, price]);

  const classification = useMemo(() => {
    const profitStatus = cmv <= 30 ? "Alto" : "Baixo";
    if (salesVolume === "Alta Venda" && profitStatus === "Alto") return { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]" };
    if (salesVolume === "Alta Venda" && profitStatus === "Baixo") return { label: "Vela/Motor", emoji: "⛵", color: "text-blue-500" };
    if (salesVolume === "Baixa Venda" && profitStatus === "Alto") return { label: "Pérola Escondida", emoji: "🦪", color: "text-emerald-600" };
    return { label: "Âncora", emoji: "⚓", color: "text-slate-600" };
  }, [cmv, salesVolume]);

  const handleAddIngredient = () => {
    const item = inventoryItems.find(i => i.id === selectedItemId);
    if (!item || !addQty) return;

    const qty = parseFloat(addQty);
    const cost = (item.cost_per_stock_unit || 0) * qty;

    setIngredients([...ingredients, {
      id: crypto.randomUUID(),
      inventoryItemId: item.id,
      name: item.name,
      quantity: qty,
      unit: item.stock_unit || "un",
      cost: cost
    }]);

    setSelectedItemId("");
    setAddQty("");
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleFinalSave = () => {
    if (!name || !price) {
      toast.error("Preencha as informações básicas.");
      return;
    }
    
    onSave({
      name,
      price: parseFloat(price.replace(/\D/g, "")) / 100,
      salesVolume,
      ingredients,
      yield: parseFloat(recipeYield),
      instructions,
      totalCost,
      unitCost,
      cmv,
      status: classification
    });
    
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setPrice("");
    setSalesVolume("Alta Venda");
    setIngredients([]);
    setRecipeYield("1");
    setInstructions("");
  };

  const progressValue = (step / 3) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <div className="p-6 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002B5B]">Nova Ficha Técnica</DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span className={step >= 1 ? "text-[#002B5B]" : ""}>1. Informações Básicas</span>
              <span className={step >= 2 ? "text-[#002B5B]" : ""}>2. Ingredientes</span>
              <span className={step >= 3 ? "text-[#002B5B]" : ""}>3. Resumo e Preparo</span>
            </div>
            <Progress value={progressValue} className="h-1.5 bg-slate-200" />
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold">Nome do Prato</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Hambúrguer Clássico" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-bold">Preço de Venda (R$)</Label>
                    <Input 
                      id="price" 
                      placeholder="R$ 0,00"
                      value={price === "" ? "" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(price.replace(/\D/g, "")) / 100)}
                      onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                      className="h-12 text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume" className="text-sm font-bold">Volume de Vendas</Label>
                    <Select value={salesVolume} onValueChange={setSalesVolume}>
                      <SelectTrigger id="volume" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta Venda">Alta Venda</SelectItem>
                        <SelectItem value="Baixa Venda">Baixa Venda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-border/60">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs font-bold uppercase">Insumo (Estoque)</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um insumo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={addQty}
                        onChange={(e) => setAddQty(e.target.value)}
                      />
                      <span className="text-xs font-bold text-muted-foreground">
                        {inventoryItems.find(i => i.id === selectedItemId)?.stock_unit || "-"}
                      </span>
                    </div>
                  </div>
                  <Button onClick={handleAddIngredient} className="bg-[#002B5B] hover:bg-[#001f3f]">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Item</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center">Qtd</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Custo Parcial</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">Nenhum insumo adicionado.</TableCell>
                      </TableRow>
                    ) : (
                      ingredients.map((ing) => (
                        <TableRow key={ing.id}>
                          <TableCell className="font-medium">{ing.name}</TableCell>
                          <TableCell className="text-center">{ing.quantity} {ing.unit}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(ing.cost)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeIngredient(ing.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <Label className="text-sm font-bold">Rendimento da Receita</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={recipeYield}
                      onChange={(e) => setRecipeYield(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">porção(ões)</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Custo Total</p>
                  <p className="text-2xl font-black text-[#002B5B]">{formatCurrency(totalCost)}</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Modo de Preparo</Label>
                <Textarea 
                  placeholder="Descreva o passo a passo para a cozinha..." 
                  className="min-h-[150px] resize-none"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              <Card className="bg-[#002B5B]/5 border-[#002B5B]/20 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4 text-[#002B5B]">
                    <CheckCircle2 className="h-5 w-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">Diagnóstico Estratégico Final</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Custo por Porção</p>
                      <p className="text-2xl font-black">{formatCurrency(unitCost)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">CMV Projetado</p>
                      <p className={cn("text-2xl font-black", cmv > 35 ? "text-red-600" : "text-emerald-600")}>
                        {cmv.toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Classificação</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{classification.emoji}</span>
                        <span className={cn("text-xl font-black uppercase tracking-tighter", classification.color)}>
                          {classification.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <div className="flex justify-between w-full">
            <Button 
              variant="ghost" 
              onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
              className="font-bold"
            >
              {step === 1 ? "Cancelar" : <><ChevronLeft className="h-4 w-4 mr-2" /> Voltar</>}
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)} 
                className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8"
                disabled={step === 1 && !name}
              >
                Próximo Passo <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinalSave} 
                className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8 shadow-lg shadow-blue-900/20"
              >
                <Save className="h-4 w-4 mr-2" /> Salvar Ficha Técnica
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
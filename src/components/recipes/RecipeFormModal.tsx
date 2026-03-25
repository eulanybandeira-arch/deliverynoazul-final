import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Search, Trash2, Plus, AlertCircle, CheckCircle2, Info, Package, Layers, BookOpen } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { usePrepBases } from "@/hooks/usePrepBases";
import { useRecipes } from "@/hooks/useRecipes";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecipeItem {
  id: string;
  type: 'insumo' | 'base' | 'receita';
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface RecipeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function RecipeFormModal({ open, onOpenChange, onSave }: RecipeFormModalProps) {
  const { items: inventoryItems } = useInventory();
  const { items: prepBases } = usePrepBases();
  const { recipes } = useRecipes();

  // Identidade
  const [name, setName] = useState("");
  const [yieldAmount, setYieldAmount] = useState("1");
  const [yieldUnit, setYieldUnit] = useState("Porção");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Abas
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [packaging, setPackaging] = useState<RecipeItem[]>([]);
  const [instructions, setInstructions] = useState("");
  
  // Precificação
  const [targetCmv, setTargetCmv] = useState("30");
  const [appliedPrice, setAppliedPrice] = useState("");

  // Busca Unificada
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    
    const results: any[] = [
      ...inventoryItems.filter(i => i.name.toLowerCase().includes(term)).map(i => ({ ...i, type: 'insumo' })),
      ...prepBases.filter(b => b.name.toLowerCase().includes(term)).map(b => ({ ...b, type: 'base' })),
      ...recipes.filter(r => r.name.toLowerCase().includes(term)).map(r => ({ ...r, type: 'receita' }))
    ];
    
    return results.slice(0, 8);
  }, [searchTerm, inventoryItems, prepBases, recipes]);

  const totalIngredientsCost = useMemo(() => ingredients.reduce((sum, i) => sum + i.cost, 0), [ingredients]);
  const totalPackagingCost = useMemo(() => packaging.reduce((sum, i) => sum + i.cost, 0), [packaging]);
  const totalRecipeCost = totalIngredientsCost + totalPackagingCost;

  const suggestedPrice = useMemo(() => {
    const cmv = parseFloat(targetCmv) || 30;
    return totalRecipeCost / (cmv / 100);
  }, [totalRecipeCost, targetCmv]);

  const realCmv = useMemo(() => {
    const price = parseFloat(appliedPrice.replace(/\D/g, "")) / 100 || 0;
    return price > 0 ? (totalRecipeCost / price) * 100 : 0;
  }, [totalRecipeCost, appliedPrice]);

  const classification = useMemo(() => {
    if (realCmv <= 0) return null;
    if (realCmv <= 25) return { label: "Tesouro", emoji: "👑", color: "text-[#002B5B] bg-[#002B5B]/5" };
    if (realCmv <= 35) return { label: "Vela/Motor", emoji: "⛵", color: "text-blue-500 bg-blue-50" };
    if (realCmv <= 45) return { label: "Pérola Escondida", emoji: "🦪", color: "text-emerald-600 bg-emerald-50" };
    return { label: "Âncora", emoji: "⚓", color: "text-slate-600 bg-slate-50" };
  }, [realCmv]);

  const handleAddItem = (item: any, isPackaging: boolean = false) => {
    const cost = item.cost_per_stock_unit || item.unit_cost || 0;
    const newItem: RecipeItem = {
      id: crypto.randomUUID(),
      type: item.type,
      name: item.name,
      quantity: 1,
      unit: item.stock_unit || item.yield_unit || 'un',
      cost: cost
    };

    if (isPackaging) setPackaging([...packaging, newItem]);
    else setIngredients([...ingredients, newItem]);
    
    setSearchTerm("");
    setShowResults(false);
  };

  const handleSave = () => {
    if (!name) {
      toast.error("Dê um nome para a receita.");
      return;
    }
    onSave({
      name, yieldAmount, yieldUnit, ingredients, packaging, instructions, targetCmv, appliedPrice
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl">
        {/* Cabeçalho Fixo */}
        <div className="p-6 border-b bg-muted/10 shrink-0">
          <div className="flex items-start gap-6">
            <div 
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-background cursor-pointer hover:bg-muted/50 transition-colors shrink-0 overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUrl ? (
                <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Foto</span>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhotoUrl(URL.createObjectURL(file));
              }} />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Receita</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Combo X-Burger Artesanal" 
                  className="h-12 text-xl font-bold border-none bg-transparent p-0 focus-visible:ring-0"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="w-32 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rendimento</Label>
                  <Input type="number" value={yieldAmount} onChange={(e) => setYieldAmount(e.target.value)} className="h-9" />
                </div>
                <div className="w-40 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unidade</Label>
                  <Select value={yieldUnit} onValueChange={setYieldUnit}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Porção">Porção</SelectItem>
                      <SelectItem value="Unidade">Unidade</SelectItem>
                      <SelectItem value="Litro">Litro</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Abas */}
        <Tabs defaultValue="composicao" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-background">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger value="composicao" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#002B5B] data-[state=active]:bg-transparent font-bold text-xs uppercase tracking-widest">1. Composição</TabsTrigger>
              <TabsTrigger value="embalagens" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#002B5B] data-[state=active]:bg-transparent font-bold text-xs uppercase tracking-widest">2. Embalagens</TabsTrigger>
              <TabsTrigger value="preparo" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#002B5B] data-[state=active]:bg-transparent font-bold text-xs uppercase tracking-widest">3. Modo de Preparo</TabsTrigger>
              <TabsTrigger value="precificacao" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#002B5B] data-[state=active]:bg-transparent font-bold text-xs uppercase tracking-widest">4. Precificação</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Aba 1: Composição */}
            <TabsContent value="composicao" className="m-0 space-y-6">
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar Insumos, Bases ou outras Fichas..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                    className="flex-1"
                  />
                </div>
                
                {showResults && filteredResults.length > 0 && (
                  <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                    {filteredResults.map((item) => (
                      <button 
                        key={item.id} 
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                        onClick={() => handleAddItem(item)}
                      >
                        {item.type === 'insumo' ? <Package className="h-4 w-4 text-blue-400" /> : item.type === 'base' ? <Layers className="h-4 w-4 text-amber-400" /> : <BookOpen className="h-4 w-4 text-primary" />}
                        <div className="flex-1">
                          <p className="text-sm font-bold">{item.name}</p>
                          <p className="text-[10px] uppercase text-muted-foreground">{item.type}</p>
                        </div>
                        <span className="text-xs font-mono">{formatCurrency(item.cost_per_stock_unit || item.unit_cost || 0)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Item</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center">Qtd. Usada</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Custo</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm italic">Nenhum ingrediente adicionado.</TableCell></TableRow>
                    ) : (
                      ingredients.map((ing) => (
                        <TableRow key={ing.id}>
                          <TableCell className="font-medium">{ing.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Input 
                                type="number" 
                                value={ing.quantity} 
                                onChange={(e) => {
                                  const q = parseFloat(e.target.value) || 0;
                                  setIngredients(ingredients.map(i => i.id === ing.id ? { ...i, quantity: q, cost: q * (i.cost / i.quantity) } : i));
                                }}
                                className="w-20 h-8 text-center" 
                              />
                              <span className="text-xs text-muted-foreground">{ing.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(ing.cost)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Aba 2: Embalagens */}
            <TabsContent value="embalagens" className="m-0 space-y-6">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Os custos aqui somam na precificação, mas não aparecem na impressão da cozinha. Use para caixas, sacolas e lacres.
                </p>
              </div>

              <div className="relative">
                <Input 
                  placeholder="Buscar Embalagens..." 
                  onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                  className="flex-1"
                />
                {showResults && filteredResults.length > 0 && (
                  <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                    {filteredResults.filter(i => i.category_logistics === 'embalagens_utensilios' || i.type === 'insumo').map((item) => (
                      <button 
                        key={item.id} 
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                        onClick={() => handleAddItem(item, true)}
                      >
                        <Package className="h-4 w-4 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">{item.name}</p>
                        </div>
                        <span className="text-xs font-mono">{formatCurrency(item.cost_per_stock_unit || item.unit_cost || 0)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Embalagem</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center">Qtd.</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-right">Custo</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packaging.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm italic">Nenhuma embalagem adicionada.</TableCell></TableRow>
                    ) : (
                      packaging.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Input 
                                type="number" 
                                value={pkg.quantity} 
                                onChange={(e) => {
                                  const q = parseFloat(e.target.value) || 0;
                                  setPackaging(packaging.map(p => p.id === pkg.id ? { ...p, quantity: q, cost: q * (p.cost / p.quantity) } : p));
                                }}
                                className="w-20 h-8 text-center" 
                              />
                              <span className="text-xs text-muted-foreground">{pkg.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(pkg.cost)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setPackaging(packaging.filter(p => p.id !== pkg.id))}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Aba 3: Modo de Preparo */}
            <TabsContent value="preparo" className="m-0">
              <div className="space-y-4">
                <Label className="text-sm font-bold">Passo a passo para a cozinha</Label>
                <Textarea 
                  placeholder="Descreva detalhadamente como preparar este prato..." 
                  className="min-h-[350px] text-base leading-relaxed resize-none"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Aba 4: Precificação */}
            <TabsContent value="precificacao" className="m-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Custo Total da Receita</Label>
                  <p className="text-3xl font-black text-[#002B5B]">{formatCurrency(totalRecipeCost)}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Sua Meta de CMV (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={targetCmv} 
                      onChange={(e) => setTargetCmv(e.target.value)}
                      className="h-12 text-xl font-bold"
                    />
                    <span className="text-xl font-bold text-muted-foreground">%</span>
                  </div>
                </div>

                <Card className="bg-[#002B5B] text-white border-none shadow-xl">
                  <CardContent className="p-6">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-80">Preço Sugerido</Label>
                    <p className="text-3xl font-black mt-1">{formatCurrency(suggestedPrice)}</p>
                    <p className="text-[10px] mt-2 opacity-70">Baseado na sua meta de {targetCmv}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                <div className="space-y-4">
                  <Label className="text-sm font-bold">Preço de Venda Aplicado (R$)</Label>
                  <Input 
                    placeholder="R$ 0,00"
                    value={appliedPrice === "" ? "" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(appliedPrice.replace(/\D/g, "")) / 100)}
                    onChange={(e) => setAppliedPrice(e.target.value.replace(/\D/g, ""))}
                    className="h-14 text-2xl font-black font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Este é o preço que será exibido no seu cardápio.</p>
                </div>

                {classification && (
                  <Card className={cn("border-none shadow-none", classification.color)}>
                    <CardContent className="p-6 flex items-center gap-6">
                      <span className="text-5xl">{classification.emoji}</span>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Diagnóstico da Engenharia</Label>
                        <p className="text-2xl font-black uppercase tracking-tighter">{classification.label}</p>
                        <p className="text-sm font-bold mt-1">CMV Real: {realCmv.toFixed(1)}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Rodapé Fixo */}
        <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
          <div className="flex justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">Cancelar</Button>
            <Button 
              onClick={handleSave} 
              className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8 h-11 shadow-lg shadow-blue-900/20"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Ficha Técnica
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
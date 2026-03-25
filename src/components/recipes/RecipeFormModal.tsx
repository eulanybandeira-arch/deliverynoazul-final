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
import { Camera, Search, Trash2, Plus, CheckCircle2, Info, Package } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- MOCK DATA PARA TESTE DE USABILIDADE ---
const MOCK_INSUMOS = [
  { id: "i1", name: "Pão Brioche", unit: "un", unitPrice: 1.50 },
  { id: "i2", name: "Carne Bovina", unit: "kg", unitPrice: 35.00 },
  { id: "i3", name: "Queijo Cheddar", unit: "kg", unitPrice: 40.00 },
];

const MOCK_EMBALAGENS = [
  { id: "e1", name: "Caixa de Hambúrguer", unit: "un", unitPrice: 1.20 },
  { id: "e2", name: "Sacola Kraft", unit: "un", unitPrice: 0.80 },
];

interface RecipeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  cost: number;
}

interface RecipeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export function RecipeFormModal({ open, onOpenChange, onSave }: RecipeFormModalProps) {
  // Identidade
  const [name, setName] = useState("");
  const [yieldAmount, setYieldAmount] = useState("1");
  const [yieldUnit, setYieldUnit] = useState("Porção");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listas de Itens
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [packaging, setPackaging] = useState<RecipeItem[]>([]);
  const [instructions, setInstructions] = useState("");
  
  // Busca e Adição
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQty, setSearchQty] = useState("1");
  const [showResults, setShowResults] = useState(false);

  // Precificação
  const [targetCmv, setTargetCmv] = useState("30");
  const [appliedPrice, setAppliedPrice] = useState("");

  // Cálculos Dinâmicos
  const totalIngredientsCost = useMemo(() => ingredients.reduce((sum, i) => sum + i.cost, 0), [ingredients]);
  const totalPackagingCost = useMemo(() => packaging.reduce((sum, i) => sum + i.cost, 0), [packaging]);
  const totalRecipeCost = totalIngredientsCost + totalPackagingCost;

  const suggestedPrice = useMemo(() => {
    const cmv = parseFloat(targetCmv) || 30;
    if (totalRecipeCost === 0) return 0;
    return (totalRecipeCost / cmv) * 100;
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

  // Handlers
  const handleAddItem = (item: any, isPackaging: boolean = false) => {
    const qty = parseFloat(searchQty) || 1;
    const newItem: RecipeItem = {
      id: crypto.randomUUID(),
      name: item.name,
      quantity: qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      cost: qty * item.unitPrice
    };

    if (isPackaging) setPackaging([...packaging, newItem]);
    else setIngredients([...ingredients, newItem]);
    
    setSearchTerm("");
    setSearchQty("1");
    setShowResults(false);
    toast.success(`${item.name} adicionado.`);
  };

  const handlePriceChange = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    setAppliedPrice(numeric);
  };

  const formatAppliedPrice = (numeric: string) => {
    if (!numeric) return "";
    const val = parseInt(numeric) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSave = () => {
    if (!name) {
      toast.error("Dê um nome para a receita.");
      return;
    }
    onSave({
      name,
      yieldAmount,
      yieldUnit,
      ingredients,
      packaging,
      instructions,
      targetCmv,
      appliedPrice
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
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block">Buscar Insumo</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Ex: Pão, Carne..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                      className="pl-10"
                    />
                  </div>
                  
                  {showResults && searchTerm && (
                    <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                      {MOCK_INSUMOS.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <button 
                          key={item.id} 
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                          onClick={() => handleAddItem(item)}
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-bold">{item.name}</span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.unitPrice)} / {item.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block">Qtd.</Label>
                  <Input type="number" value={searchQty} onChange={(e) => setSearchQty(e.target.value)} />
                </div>
                <Button className="bg-[#002B5B] hover:bg-[#001f3f]">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
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
                            <span className="text-sm">{ing.quantity} {ing.unit}</span>
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

              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block">Buscar Embalagem</Label>
                  <Input 
                    placeholder="Ex: Caixa, Sacola..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                  />
                  {showResults && searchTerm && (
                    <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                      {MOCK_EMBALAGENS.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <button 
                          key={item.id} 
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                          onClick={() => handleAddItem(item, true)}
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-bold">{item.name}</span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.unitPrice)} / {item.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block">Qtd.</Label>
                  <Input type="number" value={searchQty} onChange={(e) => setSearchQty(e.target.value)} />
                </div>
                <Button className="bg-[#002B5B] hover:bg-[#001f3f]">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
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
                            <span className="text-sm">{pkg.quantity} {pkg.unit}</span>
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
                    value={formatAppliedPrice(appliedPrice)}
                    onChange={(e) => handlePriceChange(e.target.value)}
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
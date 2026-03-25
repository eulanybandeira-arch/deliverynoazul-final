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
import { Camera, Search, Trash2, Plus, CheckCircle2, Info, Package, TrendingUp, AlertTriangle, Lightbulb, Printer } from "lucide-react";
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

const UNIT_OPTIONS = [
  "kg", "g", "L", "mL", "un", "pacote", "gotas", "colher de sopa", 
  "colher de chá", "1/4 xícara", "1/3 xícara", "1/2 xícara", 
  "2/3 xícara", "3/4 xícara", "1 xícara", "personalizada"
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
  const [salesVolume, setSalesVolume] = useState("Alta Venda");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listas de Itens
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [packaging, setPackaging] = useState<RecipeItem[]>([]);
  const [instructions, setInstructions] = useState("");
  
  // Estados da Barra de Adição Inteligente
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQty, setSearchQty] = useState("1");
  const [searchUnit, setSearchUnit] = useState("un");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Precificação
  const [targetCmv, setTargetCmv] = useState("30");
  const [appliedPrice, setAppliedPrice] = useState("");

  // Cálculos Dinâmicos
  const totalIngredientsCost = useMemo(() => ingredients.reduce((sum, i) => sum + i.cost, 0), [ingredients]);
  const totalPackagingCost = useMemo(() => packaging.reduce((sum, i) => sum + i.cost, 0), [packaging]);
  const totalRecipeCost = totalIngredientsCost + totalPackagingCost;

  const previewCost = useMemo(() => {
    if (!selectedItem) return 0;
    const qty = parseFloat(searchQty) || 0;
    let price = selectedItem.unitPrice;
    if (selectedItem.unit === "kg" && searchUnit === "g") price = price / 1000;
    if (selectedItem.unit === "L" && searchUnit === "mL") price = price / 1000;
    return qty * price;
  }, [selectedItem, searchQty, searchUnit]);

  const suggestedPrice = useMemo(() => {
    const cmv = parseFloat(targetCmv) || 30;
    if (totalRecipeCost === 0) return 0;
    return (totalRecipeCost / cmv) * 100;
  }, [totalRecipeCost, targetCmv]);

  const realCmv = useMemo(() => {
    const price = parseFloat(appliedPrice.replace(/\D/g, "")) / 100 || 0;
    return price > 0 ? (totalRecipeCost / price) * 100 : 0;
  }, [totalRecipeCost, appliedPrice]);

  // Lógica Corrigida da Matriz Estratégica
  const classification = useMemo(() => {
    if (realCmv <= 0) return null;
    const isHighProfit = realCmv <= (parseFloat(targetCmv) || 30);
    
    if (isHighProfit) {
      return salesVolume === "Alta Venda" 
        ? { label: "Tesouro", emoji: "👑" } 
        : { label: "Pérola Escondida", emoji: "🦪" };
    } else {
      return salesVolume === "Alta Venda" 
        ? { label: "Vela/Motor", emoji: "⛵" } 
        : { label: "Âncora", emoji: "⚓" };
    }
  }, [realCmv, targetCmv, salesVolume]);

  // Handlers
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setSearchTerm(item.name);
    setSearchUnit(item.unit);
    setShowResults(false);
  };

  const handleAddItem = (isPackaging: boolean = false) => {
    if (!selectedItem) {
      toast.error("Selecione um item primeiro.");
      return;
    }
    const qty = parseFloat(searchQty) || 1;
    let effectiveUnitPrice = selectedItem.unitPrice;
    if (selectedItem.unit === "kg" && searchUnit === "g") effectiveUnitPrice /= 1000;
    if (selectedItem.unit === "L" && searchUnit === "mL") effectiveUnitPrice /= 1000;

    const newItem: RecipeItem = {
      id: crypto.randomUUID(),
      name: selectedItem.name,
      quantity: qty,
      unit: isPackaging ? "un" : searchUnit,
      unitPrice: effectiveUnitPrice,
      cost: qty * effectiveUnitPrice
    };

    if (isPackaging) setPackaging([...packaging, newItem]);
    else setIngredients([...ingredients, newItem]);
    
    setSearchTerm("");
    setSearchQty("1");
    setSelectedItem(null);
    toast.success(`${selectedItem.name} adicionado.`);
  };

  const updateItemQty = (id: string, newQty: string, isPackaging: boolean) => {
    const qty = parseFloat(newQty) || 0;
    const setter = isPackaging ? setPackaging : setIngredients;
    const list = isPackaging ? packaging : ingredients;

    setter(list.map(item => {
      if (item.id === id) {
        return { ...item, quantity: qty, cost: qty * item.unitPrice };
      }
      return item;
    }));
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
      name, yieldAmount, yieldUnit, salesVolume, ingredients, packaging, instructions, targetCmv, appliedPrice
    });
    onOpenChange(false);
  };

  // Lógica de Impressão Operacional (Cozinha)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const ingredientsHtml = ingredients.map(ing => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${ing.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${ing.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${ing.unit}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha Técnica - ${name}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #002B5B; padding-bottom: 20px; margin-bottom: 30px; }
            .title-area h1 { margin: 0; color: #002B5B; font-size: 28px; text-transform: uppercase; }
            .title-area p { margin: 5px 0 0; font-weight: bold; color: #666; }
            .photo-area { width: 150px; height: 150px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center; }
            .photo-area img { max-width: 100%; max-height: 100%; object-fit: cover; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #002B5B; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f4f4f4; text-align: left; padding: 8px; font-size: 12px; text-transform: uppercase; }
            .instructions { white-space: pre-wrap; font-size: 14px; background: #fdfdfd; padding: 15px; border-radius: 4px; border: 1px solid #f0f0f0; }
            .notes-area { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px; }
            .dotted-line { border-bottom: 1px dotted #aaa; height: 30px; margin-bottom: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>${name || 'Sem Nome'}</h1>
              <p>Rendimento: ${yieldAmount} ${yieldUnit}</p>
            </div>
            <div class="photo-area">
              ${photoUrl ? `<img src="${photoUrl}" />` : '<span style="color: #ccc; font-size: 10px;">SEM FOTO</span>'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ingredientes e Quantidades</div>
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style="text-align: center;">Qtd.</th>
                  <th style="text-align: center;">Unidade</th>
                </tr>
              </thead>
              <tbody>
                ${ingredientsHtml || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">Nenhum ingrediente listado.</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Modo de Preparo</div>
            <div class="instructions">${instructions || 'Nenhuma instrução de preparo cadastrada.'}</div>
          </div>

          <div class="notes-area">
            <div class="section-title">Anotações do Chef</div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
            <div class="dotted-line"></div>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #aaa;">
            Gerado por DeliveryNoAzul - Ficha Técnica Operacional
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fichas Técnicas & Engenharia de Cardápio</Label>
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
                <div className="w-48 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume de Venda</Label>
                  <Select value={salesVolume} onValueChange={setSalesVolume}>
                    <SelectTrigger className="h-9">
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
              <div className="flex items-end gap-2 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="flex-[2] relative">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Buscar Insumo / Base</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Digite o nome..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                      className="pl-10 h-10"
                    />
                  </div>
                  {showResults && searchTerm && (
                    <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                      {MOCK_INSUMOS.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <button 
                          key={item.id} 
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                          onClick={() => handleSelectItem(item)}
                        >
                          <span className="text-sm font-bold">{item.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.unitPrice)} / {item.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-24">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Qtd.</Label>
                  <Input 
                    type="number" 
                    value={searchQty} 
                    onChange={(e) => setSearchQty(e.target.value)} 
                    className="h-10 text-center font-bold"
                  />
                </div>

                <div className="w-32">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Unidade</Label>
                  <Select value={searchUnit} onValueChange={setSearchUnit}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Custo Prévio</Label>
                  <div className="h-10 px-3 flex items-center justify-end bg-muted/50 border rounded-md font-mono text-sm font-bold text-[#002B5B]">
                    {formatCurrency(previewCost)}
                  </div>
                </div>

                <Button onClick={() => handleAddItem(false)} className="bg-[#002B5B] hover:bg-[#001f3f] h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Item</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center w-40">Qtd. Usada</TableHead>
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
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Input 
                                type="number" 
                                value={ing.quantity} 
                                onChange={(e) => updateItemQty(ing.id, e.target.value, false)}
                                className="w-24 h-8 text-center font-bold" 
                              />
                              <span className="text-[10px] font-bold uppercase text-muted-foreground w-8">{ing.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-[#002B5B]">{formatCurrency(ing.cost)}</TableCell>
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

              <div className="flex items-end gap-2 bg-muted/20 p-3 rounded-xl border border-border/50">
                <div className="flex-[2] relative">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Buscar Embalagem</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Digite o nome..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                      className="pl-10 h-10"
                    />
                  </div>
                  {showResults && searchTerm && (
                    <div className="absolute z-50 w-full bg-popover border rounded-xl shadow-2xl mt-1 overflow-hidden">
                      {MOCK_EMBALAGENS.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <button 
                          key={item.id} 
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-0"
                          onClick={() => handleSelectItem(item)}
                        >
                          <span className="text-sm font-bold">{item.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">{formatCurrency(item.unitPrice)} / {item.unit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-24">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Qtd.</Label>
                  <Input 
                    type="number" 
                    value={searchQty} 
                    onChange={(e) => setSearchQty(e.target.value)} 
                    className="h-10 text-center font-bold"
                  />
                </div>

                <div className="w-32">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Unidade</Label>
                  <Select value="un" disabled>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32">
                  <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Custo Prévio</Label>
                  <div className="h-10 px-3 flex items-center justify-end bg-muted/50 border rounded-md font-mono text-sm font-bold text-[#002B5B]">
                    {formatCurrency(previewCost)}
                  </div>
                </div>

                <Button onClick={() => handleAddItem(true)} className="bg-[#002B5B] hover:bg-[#001f3f] h-10 px-6">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Embalagem</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center w-40">Qtd.</TableHead>
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
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Input 
                                type="number" 
                                value={pkg.quantity} 
                                onChange={(e) => updateItemQty(pkg.id, e.target.value, true)}
                                className="w-24 h-8 text-center font-bold" 
                              />
                              <span className="text-[10px] font-bold uppercase text-muted-foreground w-8">{pkg.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-[#002B5B]">{formatCurrency(pkg.cost)}</TableCell>
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

            {/* Aba 4: Precificação Estratégica */}
            <TabsContent value="precificacao" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Bloco 1: O Custo */}
                <Card className="border-border/40 bg-muted/5 shadow-none">
                  <CardContent className="p-6">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">1. O Custo</Label>
                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-muted-foreground">Custo Total da Receita</p>
                      <p className="text-2xl font-black text-[#002B5B]">{formatCurrency(totalRecipeCost)}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Info className="h-3 w-3" /> Bloqueado para edição
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco 2: A Sugestão */}
                <Card className="border-border/40 bg-muted/5 shadow-none">
                  <CardContent className="p-6">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2. A Sugestão</Label>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meta de CMV (%)</Label>
                        <Input 
                          type="number" 
                          value={targetCmv} 
                          onChange={(e) => setTargetCmv(e.target.value)}
                          className="h-9 font-bold"
                        />
                        <p className="text-[10px] text-muted-foreground italic leading-tight mt-1">
                          💡 Regra de Ouro: Para garantir a meta do mês, mire 5% abaixo do seu alvo global. (Ex: Se a meta do restaurante é 30%, tente precificar este prato com 25% para cobrir perdas e desperdícios da cozinha).
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Preço Sugerido</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco 3: Sua Decisão */}
                <Card className="border-[#002B5B]/30 bg-[#002B5B]/5 shadow-lg">
                  <CardContent className="p-6">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-[#002B5B]">3. Sua Decisão</Label>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Preço de Venda Aplicado (R$)</Label>
                        <Input 
                          placeholder="R$ 0,00"
                          value={formatAppliedPrice(appliedPrice)}
                          onChange={(e) => handlePriceChange(e.target.value)}
                          className="h-12 text-xl font-black font-mono border-[#002B5B]/40 focus-visible:ring-[#002B5B]"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Este é o valor que será impresso no seu cardápio físico e digital.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco 4: Resultado Estratégico */}
                <Card className={cn(
                  "border-none shadow-xl text-white transition-colors duration-500",
                  realCmv <= 0 ? "bg-slate-400" : (realCmv <= parseFloat(targetCmv) ? "bg-emerald-600" : "bg-red-600")
                )}>
                  <CardContent className="p-6">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-80">4. Resultado Estratégico</Label>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs opacity-90">CMV Real da Ficha</p>
                        <p className="text-3xl font-black">{realCmv.toFixed(1)}%</p>
                      </div>
                      
                      {classification && (
                        <div className="pt-4 border-t border-white/20 flex items-center gap-3">
                          <span className="text-3xl">{classification.emoji}</span>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Status Dinâmico</p>
                            <p className="text-lg font-black uppercase tracking-tighter leading-none">{classification.label}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerta de Margem */}
              {realCmv > parseFloat(targetCmv) && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 items-center text-red-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Atenção: Seu CMV Real está <strong>{(realCmv - parseFloat(targetCmv)).toFixed(1)}% acima</strong> da meta. Isso indica erosão de lucro.
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Rodapé Fixo */}
        <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="font-bold border-[#002B5B] text-[#002B5B] hover:bg-[#002B5B]/5"
            >
              <Printer className="h-4 w-4 mr-2" /> Imprimir Ficha (Cozinha)
            </Button>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">Cancelar</Button>
              <Button 
                onClick={handleSave} 
                className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8 h-11 shadow-lg shadow-blue-900/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Ficha Técnica
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
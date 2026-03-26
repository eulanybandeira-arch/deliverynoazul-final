import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Search, Trash2, Plus, CheckCircle2, Info, Package, TrendingUp, AlertTriangle, Printer, Check, Link as LinkIcon, Target, Upload, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- MOCK DATA PARA BUSCA ---
const MOCK_INSUMOS = [
  { id: "i1", name: "Pão Brioche", unit: "un", unitPrice: 1.50 },
  { id: "i2", name: "Carne Bovina", unit: "kg", unitPrice: 35.00 },
  { id: "i3", name: "Queijo Cheddar", unit: "kg", unitPrice: 40.00 },
  { id: "i4", name: "FILE DE PEITO DE FRANGO", unit: "kg", unitPrice: 14.99 },
  { id: "i5", name: "CREME LEITE", unit: "g", unitPrice: 0.01 },
  { id: "i6", name: "EXTRATO DE TOMATE", unit: "g", unitPrice: 0.01 },
  { id: "i7", name: "LEITE INTEGRAL", unit: "L", unitPrice: 4.98 },
  { id: "i8", name: "KETCHUP TRADICIONAL", unit: "kg", unitPrice: 15.98 },
];

const UNIT_OPTIONS = [
  "kg", "g", "L", "mL", "un", "pacote", "gotas", "colher de sopa", 
  "colher de chá", "1/4 xícara", "1/3 xícara", "1/2 xícara", 
  "2/3 xícara", "3/4 xícara", "1 xícara", "personalizada"
];

interface RecipeItem {
  id: string;
  name: string;
  mappedName?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  cost: number;
  isLinked?: boolean;
}

type ModalStep = "upload" | "processing" | "form";

interface RecipeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  initialData?: any;
  mode?: "manual" | "ai";
}

export function RecipeFormModal({ open, onOpenChange, onSave, initialData, mode = "manual" }: RecipeFormModalProps) {
  // Controle de Etapas
  const [step, setStep] = useState<ModalStep>("form");
  
  // Estados do Formulário
  const [name, setName] = useState("");
  const [yieldAmount, setYieldAmount] = useState("1");
  const [yieldUnit, setYieldUnit] = useState("Porção");
  const [salesVolume, setSalesVolume] = useState("Alta Venda");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeItem[]>([]);
  const [packaging, setPackaging] = useState<RecipeItem[]>([]);
  const [instructions, setInstructions] = useState("");
  const [targetCmv, setTargetCmv] = useState("30");
  const [appliedPrice, setAppliedPrice] = useState("");
  const [isAiProcessed, setIsAiProcessed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  // Inicialização baseada no modo
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Modo Edição
        populateForm(initialData);
        setStep("form");
        setIsAiProcessed(false);
      } else if (mode === "ai") {
        // Modo Importação IA
        setStep("upload");
        resetForm();
      } else {
        // Modo Novo Manual
        setStep("form");
        resetForm();
        setIsAiProcessed(false);
      }
    }
  }, [open, initialData, mode]);

  const resetForm = () => {
    setName("");
    setYieldAmount("1");
    setYieldUnit("Porção");
    setIngredients([]);
    setPackaging([]);
    setInstructions("");
    setAppliedPrice("");
    setPhotoUrl(null);
  };

  const populateForm = (data: any) => {
    setName(data.name || "");
    setYieldAmount(String(data.yieldAmount || "1"));
    setYieldUnit(data.yieldUnit || "Porção");
    setSalesVolume(data.salesVolume || "Alta Venda");
    setPhotoUrl(data.photoUrl || null);
    setIngredients(data.ingredients || []);
    setPackaging(data.packaging || []);
    setInstructions(data.instructions || "");
    setTargetCmv(String(data.targetCmv || "30"));
    setAppliedPrice(String(data.appliedPrice || ""));
  };

  // Lógica de Processamento de IA (Simulada)
  const handleAiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStep("processing");
      
      setTimeout(() => {
        const extracted = {
          name: "Strogonoff de Frango Extraído",
          yieldAmount: "4",
          yieldUnit: "Porções",
          ingredients: [
            { id: "ai-1", name: "frango", mappedName: "FILE DE PEITO DE FRANGO", quantity: 0.8, unit: "kg", unitPrice: 14.99, cost: 11.99, isLinked: true },
            { id: "ai-2", name: "creme de leite", mappedName: "CREME LEITE", quantity: 200, unit: "g", unitPrice: 0.01, cost: 2.00, isLinked: true },
            { id: "ai-3", name: "champignon", mappedName: "Não encontrado", quantity: 100, unit: "g", unitPrice: 0, cost: 0, isLinked: false },
          ],
          instructions: "1. Refogue o frango.\n2. Adicione o creme de leite.\n3. Sirva com arroz.",
          targetCmv: "25",
          appliedPrice: "3200"
        };
        
        populateForm(extracted);
        setIsAiProcessed(true);
        setStep("form");
        toast.success("Receita extraída com sucesso!");
      }, 2500);
    }
  };

  // Estados da Barra de Adição Inteligente
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQty, setSearchQty] = useState("1");
  const [searchUnit, setSearchUnit] = useState("un");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

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

  const classification = useMemo(() => {
    if (realCmv <= 0) return { label: "Âncora", emoji: "⚓", color: "text-slate-600", bgColor: "bg-slate-500/10", borderColor: "border-slate-200" };
    const isHighProfit = realCmv <= (parseFloat(targetCmv) || 30);
    
    if (isHighProfit) {
      return salesVolume === "Alta Venda" 
        ? { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]", bgColor: "bg-[#002B5B]/10", borderColor: "border-[#002B5B]/20" } 
        : { label: "Pérola Escondida", emoji: "🦪", color: "text-emerald-600", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-200" };
    } else {
      return salesVolume === "Alta Venda" 
        ? { label: "Vela/Motor", emoji: "⛵", color: "text-blue-600", bgColor: "bg-blue-400/10", borderColor: "border-blue-200" } 
        : { label: "Âncora", emoji: "⚓", color: "text-slate-600", bgColor: "bg-slate-500/10", borderColor: "border-slate-200" };
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
      cost: qty * effectiveUnitPrice,
      isLinked: true
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
    
    const recipeData = {
      id: initialData?.id || crypto.randomUUID(),
      name,
      yieldAmount,
      yieldUnit,
      salesVolume,
      photoUrl,
      ingredients,
      packaging,
      instructions,
      targetCmv,
      appliedPrice,
      totalCost: totalRecipeCost,
      unitCost: totalRecipeCost / (parseFloat(yieldAmount) || 1),
      cmv: realCmv,
      status: classification,
      isActive: initialData ? initialData.isActive : true,
      isAiProcessed: false
    };

    onSave(recipeData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if(step !== "processing") onOpenChange(o); }}>
      <DialogContent className={cn(
        "p-0 overflow-hidden border-none shadow-2xl transition-all duration-500",
        step === "form" ? "max-w-5xl h-[90vh]" : "max-w-2xl h-auto"
      )}>
        
        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-6 bg-background">
            <div className="w-full space-y-6 cursor-pointer group" onClick={() => aiFileInputRef.current?.click()}>
              <input type="file" ref={aiFileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" onChange={handleAiFileSelect} />
              <div className="mx-auto w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-accent transition-all duration-300">
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">🪄 Importar Ficha Técnica (IA)</h2>
                <p className="text-muted-foreground text-sm px-4">Arraste ou selecione sua receita em <span className="font-bold text-foreground">PDF, Imagem, Excel ou Word</span>.</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        )}

        {/* STEP 2: PROCESSING */}
        {step === "processing" && (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-6 bg-background animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-primary" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Processando...</h2>
              <p className="text-muted-foreground text-sm">Analisando documento com IA...</p>
            </div>
            <p className="text-primary/80 text-xs font-bold uppercase tracking-widest animate-pulse">Extraindo informações da receita...</p>
          </div>
        )}

        {/* STEP 3: FORM (REVISION) */}
        {step === "form" && (
          <div className="flex flex-col h-full overflow-hidden bg-background">
            {isAiProcessed && (
              <div className="bg-[#2dceb6]/10 border-b border-[#2dceb6]/20 p-3 px-6 flex items-center gap-3 animate-in slide-in-from-top duration-500">
                <div className="bg-[#2dceb6] rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a7a6c]">Ficha Técnica processada por IA.</p>
                  <p className="text-xs text-[#1a7a6c]/80">Por favor, revise os ingredientes e quantidades antes de salvar.</p>
                </div>
              </div>
            )}

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
                <TabsContent value="composicao" className="m-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lista de Ingredientes</Label>
                    {isAiProcessed && (
                      <Badge className="bg-[#2dceb6] hover:bg-[#2dceb6] text-white border-none text-[10px] font-bold px-2 py-0.5">
                        ✓ {ingredients.length} ingredientes encontrados
                      </Badge>
                    )}
                  </div>

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
                      <Input type="number" value={searchQty} onChange={(e) => setSearchQty(e.target.value)} className="h-10 text-center font-bold" />
                    </div>

                    <div className="w-32">
                      <Label className="text-[10px] font-bold uppercase mb-1.5 block text-muted-foreground">Unidade</Label>
                      <Select value={searchUnit} onValueChange={setSearchUnit}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
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
                            <TableRow key={ing.id} className={cn(!ing.isLinked && "bg-orange-500/5")}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    {ing.isLinked ? (
                                      <Check className="h-3.5 w-3.5 text-[#2dceb6]" />
                                    ) : (
                                      <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                                    )}
                                    <span>{ing.name}</span>
                                  </div>
                                  {!ing.isLinked && (
                                    <div className="flex items-center gap-1.5 ml-5">
                                      <span className="text-[10px] font-bold text-orange-600 uppercase">Insumo não encontrado no banco.</span>
                                      <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                                        <LinkIcon className="h-2.5 w-2.5" /> Vincular/Cadastrar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
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

                <TabsContent value="embalagens" className="m-0 space-y-6">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">Os custos aqui somam na precificação, mas não aparecem na impressão da cozinha. Use para caixas, sacolas e lacres.</p>
                  </div>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase">Embalagem</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase text-center w-40">Qtd. Usada</TableHead>
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

                <TabsContent value="precificacao" className="m-0 space-y-8">
                  {/* Diagnóstico de Engenharia de Cardápio (BCG) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Diagnóstico de Engenharia de Cardápio</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className={cn(
                        "border-2 transition-all duration-300",
                        classification.label === "Tesouro" ? "border-[#002B5B] bg-[#002B5B]/5 shadow-md" : "border-border/40 opacity-40 grayscale"
                      )}>
                        <CardContent className="p-4 text-center space-y-1">
                          <span className="text-2xl">👑</span>
                          <p className="text-xs font-black uppercase tracking-tighter text-[#002B5B]">Tesouro</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Alta Venda | Alto Lucro</p>
                        </CardContent>
                      </Card>

                      <Card className={cn(
                        "border-2 transition-all duration-300",
                        classification.label === "Vela/Motor" ? "border-blue-500 bg-blue-50 shadow-md" : "border-border/40 opacity-40 grayscale"
                      )}>
                        <CardContent className="p-4 text-center space-y-1">
                          <span className="text-2xl">⛵</span>
                          <p className="text-xs font-black uppercase tracking-tighter text-blue-600">Vela/Motor</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Alta Venda | Baixo Lucro</p>
                        </CardContent>
                      </Card>

                      <Card className={cn(
                        "border-2 transition-all duration-300",
                        classification.label === "Pérola Escondida" ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-border/40 opacity-40 grayscale"
                      )}>
                        <CardContent className="p-4 text-center space-y-1">
                          <span className="text-2xl">🦪</span>
                          <p className="text-xs font-black uppercase tracking-tighter text-emerald-600">Pérola</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Baixa Venda | Alto Lucro</p>
                        </CardContent>
                      </Card>

                      <Card className={cn(
                        "border-2 transition-all duration-300",
                        classification.label === "Âncora" ? "border-slate-500 bg-slate-50 shadow-md" : "border-border/40 opacity-40 grayscale"
                      )}>
                        <CardContent className="p-4 text-center space-y-1">
                          <span className="text-2xl">⚓</span>
                          <p className="text-xs font-black uppercase tracking-tighter text-slate-600">Âncora</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Baixa Venda | Baixo Lucro</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border/40 bg-muted/5 shadow-none">
                      <CardContent className="p-6">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">1. O Custo</Label>
                        <div className="mt-4 space-y-1">
                          <p className="text-xs text-muted-foreground">Custo Total da Receita</p>
                          <p className="text-2xl font-black text-[#002B5B]">{formatCurrency(totalRecipeCost)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/40 bg-muted/5 shadow-none">
                      <CardContent className="p-6">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2. A Sugestão</Label>
                        <div className="mt-4 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Meta de CMV (%)</Label>
                            <Input type="number" value={targetCmv} onChange={(e) => setTargetCmv(e.target.value)} className="h-9 font-bold" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Preço Sugerido</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-[#002B5B]/30 bg-[#002B5B]/5 shadow-lg">
                      <CardContent className="p-6">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-[#002B5B]">3. Sua Decisão</Label>
                        <div className="mt-4 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Preço de Venda Aplicado (R$)</Label>
                            <Input placeholder="R$ 0,00" value={formatAppliedPrice(appliedPrice)} onChange={(e) => handlePriceChange(e.target.value)} className="h-12 text-xl font-black font-mono border-[#002B5B]/40 focus-visible:ring-[#002B5B]" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

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
                          <div className="pt-4 border-t border-white/20 flex items-center gap-3">
                            <span className="text-3xl">{classification.emoji}</span>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Status Dinâmico</p>
                              <p className="text-lg font-black uppercase tracking-tighter leading-none">{classification.label}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>

              <DialogFooter className="p-6 border-t bg-muted/5 shrink-0">
                <div className="flex justify-between items-center w-full">
                  <Button variant="outline" onClick={() => toast.info("Impressão em desenvolvimento")} className="font-bold border-[#002B5B] text-[#002B5B] hover:bg-[#002B5B]/5">
                    <Printer className="h-4 w-4 mr-2" /> Imprimir Ficha (Cozinha)
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8 h-11 shadow-lg shadow-blue-900/20">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Salvar Ficha Técnica
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
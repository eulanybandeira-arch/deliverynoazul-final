import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InventoryItem,
  PURCHASE_UNIT_OPTIONS,
  STOCK_UNIT_OPTIONS,
  LOGISTICS_CATEGORY_OPTIONS,
  CULINARY_CATEGORY_OPTIONS,
  UTENSIL_TYPE_OPTIONS,
} from "@/types/inventory";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PurchaseInvoice } from "@/types/invoice";
import { Plus, Save, X, CalendarIcon, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCostPerUnit, formatCurrency } from "@/utils/pricing";

interface InventoryFormProps {
  onSubmit: (item: any) => void;
  editingItem: InventoryItem | null;
  onCancelEdit: () => void;
  invoices: PurchaseInvoice[];
  forcedCategory?: 'embalagens_utensilios' | 'limpeza';
  title: string;
}

const initialFormData = {
  name: "",
  brand: "",
  purchase_unit: "pacote",
  stock_unit: "g",
  conversion_factor: "",
  unit_cost: 0,
  quantity_purchased: "",
  min_alert_level: "",
  min_alert_unit: "pacote", // Inicia com a unidade de compra para mais flexibilidade
  category_logistics: "nao_pereciveis",
  category_culinary: "",
  purchase_date: "",
  expiry_date: "",
  loss: "",
  package_capacity: "",
  utensil_type: "",
  purchase_note_id: "",
};

export function InventoryForm({ onSubmit, editingItem, onCancelEdit, invoices = [], forcedCategory, title }: InventoryFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [costPerStockUnit, setCostPerStockUnit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (editingItem) {
      // Garantir valores padrão para itens antigos
      const purchaseUnit = editingItem.purchase_unit || "pacote";
      const stockUnit = editingItem.stock_unit || "g";
      const conversionFactor = editingItem.conversion_factor || 1;

      // Fatores de conversão para unidades padrão (mesma lógica do submit)
      const UNIT_FACTORS: Record<string, number> = {
        kg: 1000, g: 1, L: 1000, mL: 1, unidade: 1, pacote: 1,
      };

      // min_alert_level é sempre armazenado em U.E.; aqui convertemos de volta
      // para a unidade escolhida para edição (min_alert_unit) para evitar
      // aplicar o fator de conversão em cima de um valor já convertido.
      const storedMinAlert = editingItem.min_alert_level ?? 0;
      const alertUnit = editingItem.min_alert_unit || stockUnit;

      let displayMinAlertLevel = storedMinAlert;

      if (alertUnit === "pacote" || alertUnit === purchaseUnit) {
        // Ex: armazenado em g (U.E.), exibir em pacotes (U.C.): divide pelo fator
        displayMinAlertLevel = storedMinAlert / conversionFactor;
      } else {
        const alertUnitFactor = UNIT_FACTORS[alertUnit] || 1;
        const stockUnitFactor = UNIT_FACTORS[stockUnit] || 1;
        // Converte de U.E. (armazenado) para unidade de alerta escolhida
        displayMinAlertLevel = storedMinAlert * (stockUnitFactor / alertUnitFactor);
      }

      setFormData({
        name: editingItem.name,
        brand: editingItem.brand || "",
        purchase_unit: purchaseUnit,
        stock_unit: stockUnit,
        conversion_factor: String(conversionFactor),
        unit_cost: editingItem.unit_cost || 0,
        quantity_purchased: String(editingItem.quantity_purchased),
        min_alert_level: String(displayMinAlertLevel || ""),
        min_alert_unit: alertUnit,
        category_logistics: editingItem.category_logistics,
        category_culinary: editingItem.category_culinary || "",
        purchase_date: editingItem.purchase_date ? format(new Date(editingItem.purchase_date.replace(/-/g, '\/')), 'yyyy-MM-dd') : "",
        expiry_date: editingItem.expiry_date ? format(new Date(editingItem.expiry_date.replace(/-/g, '\/')), 'yyyy-MM-dd') : "",
        loss: String(editingItem.loss || ""),
        package_capacity: editingItem.package_capacity || "",
        utensil_type: editingItem.utensil_type || "",
        purchase_note_id: editingItem.purchase_note_id || "",
      });
    } else {
      setFormData({ 
        ...initialFormData, 
        category_logistics: forcedCategory || 'nao_pereciveis',
        min_alert_unit: initialFormData.purchase_unit // Garante que começa com a unidade de compra
      });
    }
  }, [editingItem, forcedCategory]);

  useEffect(() => {
    const unitCost = formData.unit_cost || 0;
    const quantityPurchased = parseFloat(formData.quantity_purchased) || 0;
    const conversionFactor = parseFloat(formData.conversion_factor) || 0;
    
    const calculatedTotalCost = unitCost * quantityPurchased;
    setTotalCost(calculatedTotalCost);
    
    if (calculatedTotalCost > 0 && quantityPurchased > 0 && conversionFactor > 0) {
      setCostPerStockUnit(calculatedTotalCost / (quantityPurchased * conversionFactor));
    } else {
      setCostPerStockUnit(0);
    }
  }, [formData.unit_cost, formData.quantity_purchased, formData.conversion_factor]);

  // Validação em tempo real do fator de conversão
  const getConversionWarning = (): string | null => {
    const conversionFactor = parseFloat(formData.conversion_factor) || 0;
    if (conversionFactor <= 0) return null;

    const { purchase_unit, stock_unit } = formData;

    // Regras de validação baseadas nas unidades
    // kg -> g: esperado 100-5000 (100g a 5kg por pacote)
    // L -> mL: esperado 100-5000
    // pacote -> unidade: esperado 1-500
    // Mesma unidade: esperado 1

    if (purchase_unit === stock_unit) {
      if (conversionFactor !== 1) {
        return `⚠️ Unidades iguais (${purchase_unit}): o fator deveria ser 1, não ${conversionFactor}.`;
      }
      return null;
    }

    // kg para g ou L para mL
    if ((purchase_unit === 'kg' && stock_unit === 'g') || (purchase_unit === 'L' && stock_unit === 'mL')) {
      if (conversionFactor < 50) {
        return `⚠️ Fator muito baixo. Um ${purchase_unit === 'kg' ? 'kg' : 'L'} geralmente tem pelo menos 50${stock_unit}. Você quis dizer ${conversionFactor * 1000}?`;
      }
      if (conversionFactor > 10000) {
        return `⚠️ Fator muito alto (${conversionFactor}). Verifique se está correto.`;
      }
      return null;
    }

    // g para kg ou mL para L (conversão inversa)
    if ((purchase_unit === 'g' && stock_unit === 'kg') || (purchase_unit === 'mL' && stock_unit === 'L')) {
      if (conversionFactor > 1) {
        return `⚠️ Conversão de ${purchase_unit} para ${stock_unit}: o fator deveria ser menor que 1 (ex: 0.001 para 1g = 0.001kg).`;
      }
      return null;
    }

    // pacote para unidades menores
    if (purchase_unit === 'pacote') {
      if (conversionFactor > 50000) {
        return `⚠️ Fator muito alto (${conversionFactor} ${stock_unit} por pacote). Verifique se está correto.`;
      }
      if (conversionFactor < 1) {
        return `⚠️ Cada pacote deveria ter pelo menos 1 ${stock_unit}.`;
      }
      return null;
    }

    // Validação genérica para fatores extremos
    if (conversionFactor > 100000) {
      return `⚠️ Fator muito alto (${conversionFactor}). Verifique os valores.`;
    }

    return null;
  };

  const conversionWarning = getConversionWarning();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.min_alert_level) {
      toast.error("O campo 'Nível Mínimo de Alerta' é obrigatório.");
      return;
    }

    if (forcedCategory !== 'embalagens_utensilios' && !formData.expiry_date) {
      toast.error("O campo 'Validade' é obrigatório para insumos.");
      return;
    }

    const quantityPurchased = parseFloat(formData.quantity_purchased);
    if (quantityPurchased <= 0) {
      toast.error("Quantidade comprada deve ser maior que zero.");
      return;
    }

    if (formData.unit_cost <= 0) {
      toast.error("Custo unitário deve ser maior que zero.");
      return;
    }

    const conversionFactor = parseFloat(formData.conversion_factor);
    if (conversionFactor <= 0) {
      toast.error("Conteúdo unitário deve ser maior que zero.");
      return;
    }

    // Converter min_alert_level para U.E. se necessário
    let minAlertInStockUnit = parseFloat(formData.min_alert_level);
    
    // Fatores de conversão para unidades padrão
    const UNIT_FACTORS: Record<string, number> = {
      kg: 1000, g: 1, L: 1000, mL: 1, unidade: 1, pacote: 1,
    };
    
    const alertUnitFactor = UNIT_FACTORS[formData.min_alert_unit] || 1;
    const stockUnitFactor = UNIT_FACTORS[formData.stock_unit] || 1;
    
    // Converter o valor de alerta para a unidade de estoque
    // Ex: 2 kg -> 2000 g (se stock_unit for g)
    // Ex: 5 pacote -> 5 * conversionFactor (em U.E.)
    if (formData.min_alert_unit === 'pacote' || formData.min_alert_unit === formData.purchase_unit) {
      // Se for pacote ou igual à unidade de compra, multiplica pelo fator de conversão
      minAlertInStockUnit = minAlertInStockUnit * conversionFactor;
    } else if (alertUnitFactor !== stockUnitFactor) {
      // Converte entre unidades da mesma família (kg<->g, L<->mL)
      minAlertInStockUnit = minAlertInStockUnit * (alertUnitFactor / stockUnitFactor);
    }

    const submissionData = {
      ...formData,
      category_logistics: forcedCategory || formData.category_logistics,
      unit_cost: formData.unit_cost,
      total_cost: totalCost,
      quantity_purchased: quantityPurchased,
      conversion_factor: conversionFactor,
      min_alert_level: minAlertInStockUnit,
      min_alert_unit: formData.min_alert_unit,
      loss: parseFloat(formData.loss) || 0,
      cost_per_stock_unit: costPerStockUnit,
      purchase_date: formData.purchase_date || undefined,
      expiry_date: formData.expiry_date || undefined,
      package_capacity: formData.package_capacity || undefined,
      utensil_type: formData.utensil_type || undefined,
      purchase_note_id: formData.purchase_note_id || undefined,
    };

    onSubmit(submissionData);

    if (!editingItem) {
      setFormData(initialFormData);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50 mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Insumo <span className="text-destructive">*</span></Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca (Opcional)</Label>
              <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="quantity_purchased">Qtd. Comprada (U.C.) <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Quantos pacotes, unidades ou latas você comprou. Exemplo: 2 pacotes de farinha.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input id="quantity_purchased" type="number" value={formData.quantity_purchased} onChange={(e) => setFormData({ ...formData, quantity_purchased: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="purchase_unit">Unidade de Compra (U.C.) <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>A unidade em que o produto é vendido. Exemplo: pacote, lata, garrafa, kg.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={formData.purchase_unit} onValueChange={(value) => setFormData({ ...formData, purchase_unit: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PURCHASE_UNIT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="unit_cost">Custo Unitário da Compra (R$) <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Preço de 1 unidade de compra (U.C.). Exemplo: R$ 12,50 por pacote.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CurrencyInput 
                id="unit_cost" 
                value={formData.unit_cost} 
                onValueChange={(value) => setFormData({ ...formData, unit_cost: value })} 
                required 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="conversion_factor">Conteúdo Unitário (U.E.) <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Quanto há em cada U.C. na unidade de estoque. Exemplo: 1 pacote contém 1000g, então informe 1000.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                id="conversion_factor" 
                type="number" 
                value={formData.conversion_factor} 
                onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })} 
                required 
                className={conversionWarning ? "border-metric-orange focus-visible:ring-metric-orange" : ""}
              />
              {conversionWarning && (
                <p className="text-xs text-metric-orange">{conversionWarning}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="stock_unit">Unidade de Estoque (U.E.) <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>A unidade usada nas receitas e controle de estoque. Exemplo: g, mL, unidade.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={formData.stock_unit} onValueChange={(value) => setFormData({ ...formData, stock_unit: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STOCK_UNIT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Custo por U.E.</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Calculado automaticamente: Valor Total ÷ (Qtd × Conteúdo). Usado nas receitas.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {formatCostPerUnit(costPerStockUnit)} / {formData.stock_unit === 'unidade' ? 'un' : formData.stock_unit}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Valor Total (R$)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Calculado automaticamente: Custo Unitário × Qtd. Comprada. É o valor pago por este lote.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {formatCurrency(totalCost)}
              </div>
            </div>
          </div>

          {forcedCategory === 'embalagens_utensilios' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="utensil_type">Tipo de Utensílio/Embalagem</Label>
                <Select value={formData.utensil_type} onValueChange={(value) => setFormData({ ...formData, utensil_type: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {UTENSIL_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="package_capacity">Capacidade da Embalagem (Opcional)</Label>
                <Input id="package_capacity" value={formData.package_capacity} onChange={(e) => setFormData({ ...formData, package_capacity: e.target.value })} placeholder="Ex: 500ml, 750g" />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_logistics">Categoria de Logística <span className="text-destructive">*</span></Label>
                <Select value={formData.category_logistics} onValueChange={(value) => setFormData({ ...formData, category_logistics: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOGISTICS_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_culinary">Categoria Culinária (Opcional)</Label>
                <Select value={formData.category_culinary} onValueChange={(value) => setFormData({ ...formData, category_culinary: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  <SelectContent>
                    {CULINARY_CATEGORY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="min_alert_level">Nível Mínimo de Alerta <span className="text-destructive">*</span></Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Quando o estoque ficar abaixo deste valor, você receberá um alerta. Escolha a unidade ao lado (U.C. ou U.E.).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <Input 
                  id="min_alert_level" 
                  type="number" 
                  step="any"
                  value={formData.min_alert_level} 
                  onChange={(e) => setFormData({ ...formData, min_alert_level: e.target.value })} 
                  required 
                  className="flex-1"
                  placeholder="Ex: 5"
                />
                <Select 
                  value={formData.min_alert_unit} 
                  onValueChange={(value) => setFormData({ ...formData, min_alert_unit: value })}
                >
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="unidade">un</SelectItem>
                    <SelectItem value="pacote">pacote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                O sistema armazena em U.E. ({formData.stock_unit}) internamente, mas você pode informar na unidade que preferir.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={forcedCategory === 'embalagens_utensilios'}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiry_date ? format(new Date(formData.expiry_date.replace(/-/g, '\/')), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiry_date ? new Date(formData.expiry_date.replace(/-/g, '\/')) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, expiry_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loss">Perda/Quebra (%)</Label>
              <Input id="loss" type="number" value={formData.loss} onChange={(e) => setFormData({ ...formData, loss: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data da Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchase_date ? format(new Date(formData.purchase_date.replace(/-/g, '\/')), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date ? new Date(formData.purchase_date.replace(/-/g, '\/')) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, purchase_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="purchase_note_id">Associar Nota Fiscal (Opcional)</Label>
              <Select
                value={formData.purchase_note_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, purchase_note_id: value === "none" ? "" : value })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione uma nota fiscal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {invoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {format(parseISO(invoice.date), "dd/MM/yy")} - {invoice.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="w-full">
              {editingItem ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingItem ? "Salvar Alterações" : "Adicionar Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
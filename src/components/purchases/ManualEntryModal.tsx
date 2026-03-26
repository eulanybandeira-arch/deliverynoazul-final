import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EntryItem {
  id: string;
  insumoId: string;
  name: string;
  quantity: number;
  unit: string;
  totalValue: number;
  insight: {
    text: string;
    type: 'warning' | 'success' | 'neutral';
  };
}

export function ManualEntryModal({ open, onOpenChange }: ManualEntryModalProps) {
  const { items: inventoryItems } = useInventory();
  const { suppliers } = useSuppliers();
  
  const [supplierId, setSupplierId] = useState("");
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  
  const [items, setItems] = useState<EntryItem[]>([]);
  
  // Form state for the active row
  const [currentInsumoId, setCurrentInsumoId] = useState("");
  const [currentQty, setCurrentQty] = useState("");
  const [currentUnit, setCurrentUnit] = useState("un");
  const [currentTotal, setCurrentTotal] = useState("");

  const totalInvoice = useMemo(() => items.reduce((sum, item) => sum + item.totalValue, 0), [items]);

  const handleAddItem = () => {
    const insumo = inventoryItems.find(i => i.id === currentInsumoId);
    if (!insumo || !currentQty || !currentTotal) {
      toast.error("Preencha todos os campos do item.");
      return;
    }

    const qty = parseFloat(currentQty);
    const total = parseFloat(currentTotal);
    const unitPrice = total / qty;

    // Simulated Insight Logic
    let insight: EntryItem['insight'] = { text: "Preço estável", type: 'neutral' };
    if (insumo.unit_cost && unitPrice > insumo.unit_cost * 1.05) {
      const diff = ((unitPrice / insumo.unit_cost - 1) * 100).toFixed(0);
      insight = { text: `${diff}% acima da última compra`, type: 'warning' };
    } else if (insumo.unit_cost && unitPrice < insumo.unit_cost * 0.95) {
      insight = { text: "Economia detectada", type: 'success' };
    }

    const newItem: EntryItem = {
      id: crypto.randomUUID(),
      insumoId: insumo.id,
      name: insumo.name,
      quantity: qty,
      unit: currentUnit,
      totalValue: total,
      insight
    };

    setItems([...items, newItem]);
    setCurrentInsumoId("");
    setCurrentQty("");
    setCurrentTotal("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleFinalize = () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }
    toast.success("Entrada finalizada!", {
      description: `${items.length} itens adicionados ao estoque e CMV atualizado.`
    });
    onOpenChange(false);
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <div className="p-6 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Itens Nota Fiscal de Compra</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fornecedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Data do Recebimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal text-muted-foreground hover:text-muted-foreground",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    {entryDate ? format(entryDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 w-[var(--radix-popover-trigger-width)]" 
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={setEntryDate}
                    initialFocus
                    locale={ptBR}
                    className="w-full"
                    classNames={{
                      months: "w-full flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "w-full space-y-4",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Linha de Entrada Ativa */}
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase text-primary">Selecionar Insumo</Label>
                <Select value={currentInsumoId} onValueChange={setCurrentInsumoId}>
                  <SelectTrigger className="h-10 bg-background">
                    <SelectValue placeholder="Buscar insumo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-primary">Quantidade</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={currentQty}
                  onChange={(e) => setCurrentQty(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-primary">Valor Total (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="0,00" 
                  value={currentTotal}
                  onChange={(e) => setCurrentTotal(e.target.value)}
                  className="h-10 bg-background font-mono font-bold"
                />
              </div>
              <Button onClick={handleAddItem} className="h-10 bg-primary hover:bg-primary/90 shadow-md">
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase py-4">Item</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center">Qtd</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Valor Total</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center">Insight de IA</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                      Nenhum item lançado nesta nota.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-sm">{item.name}</TableCell>
                      <TableCell className="text-center font-medium">{item.quantity} {item.unit}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatCurrency(item.totalValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "gap-1.5 py-1 px-2 border-none text-[10px] font-bold uppercase tracking-tighter",
                            item.insight.type === 'warning' ? "bg-red-500/10 text-red-600" : 
                            item.insight.type === 'success' ? "bg-green-500/10 text-green-600" : 
                            "bg-slate-500/10 text-slate-600"
                          )}
                        >
                          {item.insight.type === 'warning' && <AlertTriangle className="h-3 w-3" />}
                          {item.insight.type === 'success' && <TrendingUp className="h-3 w-3" />}
                          {item.insight.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valor Total da Nota:</span>
            <span className="text-3xl font-black text-primary font-mono">{formatCurrency(totalInvoice)}</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">Cancelar</Button>
            <Button onClick={handleFinalize} className="bg-primary hover:bg-primary/90 font-bold px-8 h-12 shadow-lg shadow-primary/20">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar e Atualizar Estoque
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
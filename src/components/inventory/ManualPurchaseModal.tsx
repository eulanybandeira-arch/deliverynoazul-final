import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, TrendingUp, Calendar as CalendarIcon, Store, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";

interface PurchaseItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  total: number;
  insight?: string;
}

interface ManualPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualPurchaseModal({ open, onOpenChange }: ManualPurchaseModalProps) {
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: "1", name: "Filé de Frango Resfriado", qty: 20, unit: "kg", total: 460, insight: "7% acima da última compra" }
  ]);
  
  const [newItem, setNewItem] = useState({ name: "", qty: "", unit: "kg", total: "" });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.qty || !newItem.total) return;
    
    const item: PurchaseItem = {
      id: crypto.randomUUID(),
      name: newItem.name,
      qty: parseFloat(newItem.qty),
      unit: newItem.unit,
      total: parseFloat(newItem.total),
      insight: "Preço estável"
    };
    
    setItems([...items, item]);
    setNewItem({ name: "", qty: "", unit: "kg", total: "" });
    toast.success("Item adicionado à lista");
  };

  const totalInvoice = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <div className="p-6 border-b bg-slate-50/50 dark:bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Itens Nota Fiscal de Compra</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fornecedor</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ex: Atacadão Distribuidora" className="pl-10 h-10 bg-background" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data do Recebimento</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" className="pl-10 h-10 bg-background" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* LINHA DE ENTRADA ATIVA */}
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-primary">Selecionar Insumo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar no banco de insumos..." 
                    className="pl-10 h-10 bg-background border-primary/20"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-primary">Qtd.</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  className="h-10 bg-background border-primary/20"
                  value={newItem.qty}
                  onChange={(e) => setNewItem({...newItem, qty: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-primary">Unidade</Label>
                <Select value={newItem.unit} onValueChange={(v) => setNewItem({...newItem, unit: v})}>
                  <SelectTrigger className="h-10 bg-background border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="un">un</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-primary">Valor Total</Label>
                <Input 
                  type="number" 
                  placeholder="R$ 0,00" 
                  className="h-10 bg-background border-primary/20 font-bold"
                  value={newItem.total}
                  onChange={(e) => setNewItem({...newItem, total: e.target.value})}
                />
              </div>
              <div className="md:col-span-1">
                <Button onClick={handleAddItem} className="w-full h-10 bg-primary hover:bg-primary/90 shadow-lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* LISTA DE ITENS */}
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase">Item</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center">Qtd/Un</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Valor Total</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Insight de Custo</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-sm">{item.name}</TableCell>
                    <TableCell className="text-center text-sm">{item.qty} {item.unit}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">{formatCurrency(item.total)}</TableCell>
                    <TableCell>
                      {item.insight && (
                        <Badge variant="outline" className="text-[9px] font-bold uppercase border-destructive/30 text-destructive bg-destructive/5 gap-1">
                          <TrendingUp className="h-2.5 w-2.5" /> {item.insight}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="bg-white dark:bg-background border border-border/50 px-6 py-2 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">Valor Total da Nota</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(totalInvoice)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">Cancelar</Button>
            <Button className="bg-primary hover:bg-primary/90 font-bold px-8 h-12 shadow-xl shadow-primary/20 gap-2">
              <CheckCircle2 className="h-5 w-5" /> Finalizar e Atualizar Estoque
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertTriangle, FileText, Trash2, Sparkles } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";

interface ExtractedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  selected: boolean;
}

interface AiExtractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: (items: ExtractedItem[]) => void;
}

export function AiExtractionModal({ open, onOpenChange, file, onConfirm }: AiExtractionModalProps) {
  const [step, setStep] = useState<"loading" | "review">("loading");
  const [items, setItems] = useState<ExtractedItem[]>([]);

  useEffect(() => {
    if (open && file) {
      setStep("loading");
      // Simulação de processamento da IA
      const timer = setTimeout(() => {
        setItems([
          { id: "1", name: "Queijo Mussarela Fatiado", quantity: 5, unit: "kg", price: 42.00, total: 210.00, selected: true },
          { id: "2", name: "Tomate Italiano Extra", quantity: 10, unit: "kg", price: 6.50, total: 65.00, selected: true },
          { id: "3", name: "Óleo de Soja 900ml", quantity: 20, unit: "un", price: 5.80, total: 116.00, selected: true },
          { id: "4", name: "Saco de Lixo 100L", quantity: 2, unit: "pct", price: 15.00, total: 30.00, selected: false },
        ]);
        setStep("review");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, file]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItem = (id: string, field: keyof ExtractedItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = () => {
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos um item para importar.");
      return;
    }
    onConfirm(selectedItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === "loading" ? "Processando Documento" : "Revisão de Extração IA"}
          </DialogTitle>
          <DialogDescription>
            {step === "loading" 
              ? "Nossa inteligência está lendo os dados da sua nota..." 
              : "Confirme os itens identificados e selecione quais deseja adicionar ao estoque."}
          </DialogDescription>
        </DialogHeader>

        {step === "loading" ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">Lendo itens e preços...</p>
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos dependendo da qualidade da imagem.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox 
                        checked={items.every(i => i.selected)}
                        onCheckedChange={(checked) => setItems(prev => prev.map(i => ({ ...i, selected: !!checked })))}
                      />
                    </TableHead>
                    <TableHead>Item Identificado</TableHead>
                    <TableHead className="text-center w-24">Qtd</TableHead>
                    <TableHead className="text-center w-24">Unidade</TableHead>
                    <TableHead className="text-right w-32">Preço Unit.</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className={cn(!item.selected && "opacity-50")}>
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={item.selected} 
                          onCheckedChange={() => toggleItem(item.id)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.name} 
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="h-8 text-sm font-medium border-transparent hover:border-input focus:border-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={item.quantity} 
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm text-center"
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number"
                          value={item.price} 
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm text-right font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Resumo da Importação</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Selecionado</p>
                <p className="text-xl font-black text-primary">
                  {formatCurrency(items.filter(i => i.selected).reduce((sum, i) => sum + i.total, 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {step === "review" && (
            <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar e Salvar no Estoque
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
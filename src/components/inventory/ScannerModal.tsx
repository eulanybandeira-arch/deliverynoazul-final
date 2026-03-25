import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Plus, Trash2, CheckCircle2, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

interface ScannedItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (items: ScannedItem[]) => void;
}

export function ScannerModal({ open, onOpenChange, onSave }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);

  // Simulação de extração da IA
  const simulateScan = () => {
    setIsUploading(true);
    setTimeout(() => {
      setItems([
        { id: "1", name: "Filé de Frango Resfriado", unit: "kg", quantity: 15, price: 18.90 },
        { id: "2", name: "Óleo de Soja 900ml", unit: "un", quantity: 20, price: 6.50 },
        { id: "3", name: "Arroz Agulhinha T1 5kg", unit: "un", quantity: 10, price: 24.90 },
      ]);
      setIsUploading(false);
      setStep(2);
      toast.success("Nota lida com sucesso! Revise os itens abaixo.");
    }, 2000);
  };

  const handleAddItem = () => {
    const newItem: ScannedItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      unit: "kg",
      quantity: 0,
      price: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ScannedItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleConfirm = () => {
    onSave(items);
    onOpenChange(false);
    setStep(1);
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) setStep(1);
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scanner de Notas e Listas
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Envie uma foto ou PDF da sua nota fiscal para extração automática." 
              : "Audite os dados lidos pela IA antes de salvar no seu banco de insumos."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div 
            className="mt-4 border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={simulateScan}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <div className="text-center">
                  <p className="font-bold">Extraindo dados com IA...</p>
                  <p className="text-sm text-muted-foreground">Isso leva apenas alguns segundos.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Clique ou arraste o arquivo aqui</p>
                  <p className="text-sm text-muted-foreground">Suporta JPG, PNG e PDF (Notas Fiscais ou Listas)</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase">Nome Identificado</TableHead>
                    <TableHead className="text-xs font-bold uppercase w-[120px]">U.M.</TableHead>
                    <TableHead className="text-xs font-bold uppercase w-[100px]">Qtd.</TableHead>
                    <TableHead className="text-xs font-bold uppercase w-[120px]">Preço Unit.</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input 
                          value={item.name} 
                          onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.unit} 
                          onValueChange={(v) => handleUpdateItem(item.id, "unit", v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="L">Litro</SelectItem>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={item.quantity} 
                          onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          value={item.price} 
                          onChange={(e) => handleUpdateItem(item.id, "price", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Linha Manualmente
            </Button>
          </div>
        )}

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button onClick={handleConfirm} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar e Salvar Insumos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
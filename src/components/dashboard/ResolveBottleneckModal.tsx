import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bottleneckTitle: string;
  onConfirm: (actionType: string, notes: string) => void;
}

export function ResolveBottleneckModal({ open, onOpenChange, bottleneckTitle, onConfirm }: Props) {
  const [actionType, setActionType] = useState("treinamento");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onConfirm(actionType, notes);
    onOpenChange(false);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-orange-500" />
            Resolver Gargalo
          </DialogTitle>
          <DialogDescription>
            Registre a ação corretiva para o item: <span className="font-bold text-foreground">{bottleneckTitle}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="action-type">Tipo de Intervenção</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger id="action-type">
                <SelectValue placeholder="Selecione a ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="treinamento">Treinamento de Equipe</SelectItem>
                <SelectItem value="fornecedor">Troca/Negociação Fornecedor</SelectItem>
                <SelectItem value="ficha">Ajuste de Ficha Técnica</SelectItem>
                <SelectItem value="processo">Mudança de Processo</SelectItem>
                <SelectItem value="outro">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">O que foi feito?</Label>
            <Textarea 
              id="description" 
              placeholder="Ex: Reorientação sobre o peso padrão do hambúrguer para evitar desperdício." 
              className="h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Registrar Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
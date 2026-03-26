import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Play } from "lucide-react";

interface NewCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void;
}

export function NewCountModal({ open, onOpenChange, onConfirm }: NewCountModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleStart = () => {
    onConfirm(selectedDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Nova Contagem de Estoque
          </DialogTitle>
          <DialogDescription>
            Selecione a data de referência para este inventário.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inventory-date">Data do Inventário</Label>
            <Input
              id="inventory-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Atenção:</strong> Ao começar, qualquer contagem pendente não salva será descartada para iniciar o novo período.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleStart} className="gap-2">
            <Play className="h-4 w-4 fill-current" />
            Começar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
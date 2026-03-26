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
import { Label } from "@/components/ui/label";
import { Play } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NewCountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void;
}

export function NewCountModal({ open, onOpenChange, onConfirm }: NewCountModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleStart = () => {
    if (date) {
      onConfirm(date.toISOString().split('T')[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            Nova Contagem de Estoque
          </DialogTitle>
          <DialogDescription>
            Selecione a data de referência para este inventário.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Data do Inventário</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-muted-foreground hover:text-muted-foreground",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="p-0 w-[var(--radix-popover-trigger-width)]" 
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={ptBR}
                  className="w-full"
                />
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Atenção:</strong> Ao começar, qualquer contagem pendente não salva será descartada para iniciar o novo período.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleStart} className="gap-2" disabled={!date}>
            <Play className="h-4 w-4 fill-current" />
            Começar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
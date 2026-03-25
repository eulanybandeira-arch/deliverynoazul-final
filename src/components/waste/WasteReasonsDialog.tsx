import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import type { WasteReason } from "@/types/waste";

interface WasteReasonsDialogProps {
  open: boolean;
  onClose: () => void;
  reasons: WasteReason[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WasteReasonsDialog({ open, onClose, reasons, onAdd, onDelete }: WasteReasonsDialogProps) {
  const [newReason, setNewReason] = useState("");

  const handleAdd = async () => {
    if (!newReason.trim()) return;
    await onAdd(newReason.trim());
    setNewReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Motivos</DialogTitle>
          <DialogDescription>Adicione ou remova motivos de desperdício.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Novo motivo..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="icon" onClick={handleAdd} disabled={!newReason.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {reasons.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum motivo cadastrado</p>
            ) : (
              reasons.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{r.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (confirm(`Excluir motivo "${r.name}"?`)) onDelete(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface ClosureItem {
  name: string;
  expected: number;
  counted: number;
  unit: string;
}

interface ClosureHistory {
  id: string;
  date: string;
  status: "Concluído" | "Ajustado";
  volume: number;
  responsible: string;
  items: ClosureItem[];
}

interface ClosureDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closure: ClosureHistory | null;
  onUpdate?: (updatedClosure: ClosureHistory) => void;
  onDelete?: (id: string) => void;
}

export function ClosureDetailsModal({ 
  open, 
  onOpenChange, 
  closure, 
  onUpdate, 
  onDelete 
}: ClosureDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<ClosureItem[]>([]);

  useEffect(() => {
    if (closure) {
      setEditedItems([...closure.items]);
      setIsEditing(false);
    }
  }, [closure, open]);

  if (!closure) return null;

  const handleUpdateCount = (index: number, value: string) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], counted: parseFloat(value) || 0 };
    setEditedItems(newItems);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...closure,
        items: editedItems,
        status: "Ajustado"
      });
      toast.success("Inventário atualizado com sucesso!");
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este registro de inventário permanentemente?")) {
      if (onDelete) {
        onDelete(closure.id);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <span>Inventário - {closure.date}</span>
              <Badge variant={closure.status === "Concluído" ? "default" : "secondary"}>
                {closure.status}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Responsável: {closure.responsible} | Total de itens: {closure.volume}
          </div>
        </DialogHeader>

        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-center">Esperado (Sistema)</TableHead>
                <TableHead className="text-center">Contado (Físico)</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editedItems.map((item, idx) => {
                const diff = item.counted - item.expected;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.expected} {item.unit}</TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input 
                          type="number" 
                          value={item.counted} 
                          onChange={(e) => handleUpdateCount(idx, e.target.value)}
                          className="w-24 mx-auto text-center h-8"
                        />
                      ) : (
                        <span>{item.counted} {item.unit}</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {diff > 0 ? `+${diff}` : diff} {item.unit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          {isEditing && (
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Alterações
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
}

export function ClosureDetailsModal({ open, onOpenChange, closure }: ClosureDetailsModalProps) {
  if (!closure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Fechamento - {closure.date}</span>
            <Badge variant={closure.status === "Concluído" ? "default" : "destructive"}>
              {closure.status}
            </Badge>
          </DialogTitle>
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
              {closure.items.map((item, idx) => {
                const diff = item.counted - item.expected;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.expected} {item.unit}</TableCell>
                    <TableCell className="text-center">{item.counted} {item.unit}</TableCell>
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
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
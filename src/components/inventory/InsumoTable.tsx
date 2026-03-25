import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, EyeOff, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insumo {
  id: string;
  name: string;
  category: string;
  purchaseUnit: string;
  stockUnit: string;
  yieldFactor: number;
  avgCostUE: number;
  isActiveCMV: boolean;
}

interface InsumoTableProps {
  data: Insumo[];
  onEdit: (insumo: Insumo) => void;
  onDelete: (id: string) => void;
}

export function InsumoTable({ data, onEdit, onDelete }: InsumoTableProps) {
  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">Nome do Insumo</TableHead>
            <TableHead className="font-bold">U.C. (Compra)</TableHead>
            <TableHead className="font-bold">U.E. (Estoque)</TableHead>
            <TableHead className="font-bold text-center">Rendimento (%)</TableHead>
            <TableHead className="font-bold text-right">Custo Médio (U.E.)</TableHead>
            <TableHead className="font-bold text-center">Status CMV</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={item.id} 
              className="hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onEdit(item)}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">
                    {item.category}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.purchaseUnit}</TableCell>
              <TableCell className="text-muted-foreground">{item.stockUnit}</TableCell>
              <TableCell className="text-center font-medium">
                {item.yieldFactor}%
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {formatCurrency(item.avgCostUE)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  {item.isActiveCMV ? (
                    <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      <CheckCircle2 className="h-3 w-3" /> Ativo
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      <EyeOff className="h-3 w-3" /> Oculto
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
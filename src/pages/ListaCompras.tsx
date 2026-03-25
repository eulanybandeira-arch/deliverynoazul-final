import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const MOCK_ITEMS = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", currentStock: 12.5, cmd: 4.2, includeLeadTime: true, finalOrder: 0 },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", currentStock: 8.0, cmd: 3.5, includeLeadTime: true, finalOrder: 0 },
];

export default function ListaCompras() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [globalDaysToKeep, setGlobalDaysToKeep] = useState(7);
  const [globalLeadTime, setGlobalLeadTime] = useState(2);

  const calculateSuggested = (item: any) => {
    const effectiveLeadTime = item.includeLeadTime ? globalLeadTime : 0;
    const needed = item.cmd * (globalDaysToKeep + effectiveLeadTime);
    const suggestion = needed - item.currentStock;
    return suggestion > 0 ? Math.ceil(suggestion * 10) / 10 : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Lista de Compras Inteligente</h1>
          <p className="text-muted-foreground">Parametrize seu estoque de segurança e confirme o pedido final.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5"><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</Button>
          <Button className="gap-2 shadow-md bg-primary hover:bg-primary/90"><ShoppingCart className="h-4 w-4" /> Finalizar e Gerar PDF</Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase">Dias de Cobertura Desejada</Label>
            <Input type="number" className="h-12 text-2xl text-center font-bold text-primary border-primary/30" value={globalDaysToKeep} onChange={(e) => setGlobalDaysToKeep(Number(e.target.value))} />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase">Prazo Médio de Entrega</Label>
            <Input type="number" className="h-12 text-2xl text-center font-bold text-primary border-primary/30" value={globalLeadTime} onChange={(e) => setGlobalLeadTime(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px] px-4 text-center"></TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase">Insumo</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Estoque Atual</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Sugerido</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center w-[160px]">Qtd. Comprar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                <TableCell className="px-4 py-4 text-center"><Checkbox checked={selectedIds.has(item.id)} /></TableCell>
                <TableCell className="px-4 py-4"><span className="font-bold text-foreground">{item.name}</span></TableCell>
                <TableCell className="text-center font-medium text-sm">{item.currentStock}</TableCell>
                <TableCell className="text-center">{calculateSuggested(item) > 0 ? <span className="text-base font-bold text-primary">{calculateSuggested(item)}</span> : <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}</TableCell>
                <TableCell className="px-4"><div className="flex justify-center"><Input type="number" placeholder="0.0" className="w-32 text-center font-bold h-10 border-primary/20" /></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
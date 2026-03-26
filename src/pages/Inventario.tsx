import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Plus, 
  Calendar as CalendarIcon, 
  Check, 
  CheckCircle2,
  Eye,
  Printer,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventory";

export default function Inventario() {
  const { items: inventoryItems, loading } = useInventory();
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const handleUpdateCount = (id: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setCounts(prev => ({ ...prev, [id]: numValue }));
  };

  const handleConfirm = (id: string) => {
    if (counts[id] === undefined) {
      toast.error("Informe a quantidade contada.");
      return;
    }
    setConfirmedIds(prev => new Set(prev).add(id));
    toast.success("Item registrado na contagem.");
  };

  const handleFinalize = () => {
    if (confirmedIds.size < inventoryItems.length) {
      toast.warning(`Atenção: Você contou apenas ${confirmedIds.size} de ${inventoryItems.length} itens.`);
    }
    toast.success("Inventário fechado com sucesso! O CMV Real foi atualizado.");
  };

  const handleNewCount = () => {
    setConfirmedIds(new Set());
    setCounts({});
    toast.info("Nova contagem iniciada.");
  };

  const handlePrintHistory = (id: string) => {
    toast.info("Gerando visualização de impressão...");
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">
              Inventário & Auditoria
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Registre o que realmente está na prateleira hoje para apurar o CMV real.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border/40">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <input 
              type="date" 
              value={inventoryDate} 
              onChange={(e) => setInventoryDate(e.target.value)}
              className="border-none bg-transparent h-7 w-32 p-0 focus-visible:outline-none font-bold text-sm text-primary"
            />
          </div>
          <Button variant="outline" className="gap-2" onClick={handleNewCount}>
            <Plus className="h-4 w-4" /> Nova Contagem
          </Button>
          <Button className="gap-2" onClick={handleFinalize}>
            <CheckCircle2 className="h-4 w-4" /> Fechar Inventário
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-3 mb-6">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="counted">Contados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="rounded-xl border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-center">Quantidade Contada</TableHead>
                  <TableHead className="text-center">Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.filter(i => !confirmedIds.has(i.id)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">{item.category_logistics}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Input 
                          type="number" 
                          className="w-24 text-center font-bold" 
                          value={counts[item.id] ?? ""} 
                          onChange={(e) => handleUpdateCount(item.id, e.target.value)} 
                          placeholder="0.00"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold">{item.stock_unit || item.unit || 'un'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleConfirm(item.id)}>
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="counted">
          <div className="rounded-xl border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-center">Qtd. Registrada</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.filter(i => confirmedIds.has(i.id)).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.name}</TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {counts[item.id]} {item.stock_unit || item.unit || 'un'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-green-600 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirmado
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-xl border overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">18/03/2026</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell className="text-center">
                    <Badge>Concluído</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toast.info("Visualizando detalhes...")}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrintHistory("1")}><Printer className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
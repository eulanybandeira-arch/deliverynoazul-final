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
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MOCK_ITEMS = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", confirmed: false, realCount: undefined as number | undefined },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", confirmed: false, realCount: undefined as number | undefined },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", unit: "kg", confirmed: false, realCount: undefined as number | undefined },
  { id: "4", name: "Arroz Agulhinha T1", category: "Secos", unit: "kg", confirmed: false, realCount: undefined as number | undefined },
  { id: "5", name: "Óleo de Soja", category: "Secos", unit: "L", confirmed: false, realCount: undefined as number | undefined },
  { id: "6", name: "Filé de Frango", category: "Frangos", unit: "kg", confirmed: false, realCount: undefined as number | undefined },
];

const MOCK_HISTORY = [
  { 
    id: "h1", 
    date: "18/03/2026", 
    status: "Concluído", 
    volume: 3,
    responsible: "Admin",
  },
  { 
    id: "h2", 
    date: "15/03/2026", 
    status: "Ajustado", 
    volume: 12,
    responsible: "João Silva",
  },
];

export default function Inventario() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);

  const pendingItems = useMemo(() => items.filter(i => !i.confirmed), [items]);
  const countedItems = useMemo(() => items.filter(i => i.confirmed), [items]);

  const handleUpdateCount = (id: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, realCount: numValue } : item
    ));
  };

  const handleConfirm = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item?.realCount === undefined) {
      toast.error("Informe a quantidade contada.");
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, confirmed: true } : i));
    toast.success(`${item.name} registrado.`);
  };

  const handleFinalize = () => {
    if (pendingItems.length > 0) {
      toast.error(`Ainda restam ${pendingItems.length} itens para contar.`);
      return;
    }
    toast.success("Inventário fechado com sucesso!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">
              Inventário de Estoque
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
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Nova contagem iniciada")}>
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
          <div className="rounded-xl border overflow-hidden">
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
                {pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Input 
                          type="number" 
                          className="w-24 text-center" 
                          value={item.realCount ?? ""} 
                          onChange={(e) => handleUpdateCount(item.id, e.target.value)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.unit}</Badge>
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
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-center">Qtd. Registrada</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.name}</TableCell>
                    <TableCell className="text-center font-mono">{item.realCount} {item.unit}</TableCell>
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
          <div className="rounded-xl border overflow-hidden">
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
                {MOCK_HISTORY.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.date}</TableCell>
                    <TableCell>{h.responsible}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={h.status === "Concluído" ? "default" : "secondary"}>
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
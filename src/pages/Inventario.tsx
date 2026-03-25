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
  History,
  CheckCircle2,
  Eye,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
            <h1 className="text-3xl font-bold tracking-tight dark:text-foreground">
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
          <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5 rounded-xl">
            <Plus className="h-4 w-4" /> Nova Contagem
          </Button>
          <Button onClick={handleFinalize} className="gap-2 shadow-lg bg-primary hover:bg-primary/90 rounded-xl font-bold">
            <CheckCircle2 className="h-4 w-4" /> Fechar Inventário
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full max-w-[550px] grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
              Pendentes <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px] text-[10px]">{pendingItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="counted" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
              Contados <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px] text-[10px]">{countedItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="mt-0">
          <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 pl-6">Insumo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Quantidade Contada</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Unidade</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm italic">
                      Tudo contado! Não há itens pendentes para esta data.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{item.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-32 text-center font-bold h-9 bg-background/50 border-border/40 focus-visible:ring-primary" 
                            value={item.realCount ?? ""} 
                            onChange={(e) => handleUpdateCount(item.id, e.target.value)} 
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">{item.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-primary hover:bg-primary/10" 
                          onClick={() => handleConfirm(item.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="counted" className="mt-0">
          <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 pl-6">Insumo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Qtd. Registrada</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Unidade</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm italic">
                      Nenhum item contado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  countedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-4 pl-6 font-bold text-sm">{item.name}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-primary">{item.realCount}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{item.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5 text-green-500 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirmado
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 pl-6">Data do Fechamento</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Responsável</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Itens</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4 pl-6 font-bold text-sm">{h.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.responsible}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-bold">{h.volume} itens</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] uppercase font-bold",
                        h.status === "Concluído" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {h.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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
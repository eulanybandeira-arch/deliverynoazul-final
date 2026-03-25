import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardCheck, 
  Printer, 
  Plus, 
  Calendar as CalendarIcon, 
  Check, 
  Pencil, 
  History,
  Loader2,
  Eye,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ClosureDetailsModal } from "@/components/inventory/ClosureDetailsModal";

const MOCK_ITEMS = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", confirmed: false },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", confirmed: false },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", unit: "kg", confirmed: false },
  { id: "4", name: "Arroz Agulhinha T1", category: "Secos", unit: "kg", confirmed: false },
  { id: "5", name: "Óleo de Soja", category: "Secos", unit: "L", confirmed: false },
  { id: "6", name: "Filé de Frango", category: "Frangos", unit: "kg", confirmed: false },
];

const MOCK_HISTORY = [
  { 
    id: "h1", 
    date: "18/03/2026", 
    status: "Concluído", 
    volume: 3,
    responsible: "Admin",
    items: [
      { name: "Picanha Argentina", expected: 10, counted: 10, unit: "kg" },
      { name: "Queijo Mussarela", expected: 5, counted: 5, unit: "kg" },
      { name: "Tomate Italiano", expected: 15, counted: 15, unit: "kg" },
    ]
  },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "Litro" },
  { value: "ml", label: "ml" },
  { value: "un", label: "un" },
  { value: "cx", label: "cx" },
];

export default function Inventario() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">
              Inventário de Estoque
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Registre o que realmente está na prateleira hoje.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <input 
              type="date" 
              value={inventoryDate} 
              onChange={(e) => setInventoryDate(e.target.value)}
              className="border-none bg-transparent h-7 w-32 p-0 focus-visible:outline-none font-medium text-sm text-primary"
            />
          </div>
          <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
            <Plus className="h-4 w-4" /> Nova Contagem
          </Button>
          <Button onClick={handleFinalize} className="gap-2 shadow-md bg-primary hover:bg-primary/90">
            <CheckCircle2 className="h-4 w-4" /> Fechar Inventário do Dia
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full max-w-[550px] grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Pendentes <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px]">{pendingItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="counted" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              Contabilizados <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px]">{countedItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-center">Quantidade Contada</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Input type="number" placeholder="0.00" className="w-32 text-center font-bold" value={item.realCount ?? ""} onChange={(e) => handleUpdateCount(item.id, e.target.value)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground uppercase text-xs">{item.unit}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => handleConfirm(item.id)}><Check className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
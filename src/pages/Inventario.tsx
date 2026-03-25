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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  realCount?: number;
  confirmed: boolean;
}

interface ClosureHistory {
  id: string;
  date: string;
  status: "Concluído" | "Ajustado";
  volume: number;
}

const MOCK_ITEMS: InventoryItem[] = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", confirmed: false },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", confirmed: false },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", unit: "kg", confirmed: false },
  { id: "4", name: "Arroz Agulhinha T1", category: "Secos", unit: "kg", confirmed: false },
  { id: "5", name: "Óleo de Soja", category: "Secos", unit: "L", confirmed: false },
  { id: "6", name: "Filé de Frango", category: "Frangos", unit: "kg", confirmed: false },
];

const MOCK_HISTORY: ClosureHistory[] = [
  { id: "h1", date: "18/03/2026", status: "Concluído", volume: 42 },
  { id: "h2", date: "11/03/2026", status: "Concluído", volume: 38 },
  { id: "h3", date: "04/03/2026", status: "Ajustado", volume: 45 },
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
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [history, setHistory] = useState<ClosureHistory[]>(MOCK_HISTORY);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  const pendingItems = useMemo(() => items.filter(i => !i.confirmed), [items]);
  const countedItems = useMemo(() => items.filter(i => i.confirmed), [items]);

  const handleUpdateCount = (id: string, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, realCount: numValue } : item
    ));
  };

  const handleUpdateUnit = (id: string, unit: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, unit } : item
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

  const handleEdit = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, confirmed: false } : i));
  };

  const handleNewInventory = () => {
    if (confirm("Deseja iniciar uma nova contagem? Os dados atuais não salvos serão perdidos.")) {
      setItems(MOCK_ITEMS.map(i => ({ ...i, realCount: undefined, confirmed: false })));
      setInventoryDate(new Date().toISOString().split('T')[0]);
      toast.info("Nova folha de contagem iniciada.");
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      const doc = new jsPDF();
      const dateStr = new Date(inventoryDate).toLocaleDateString('pt-BR');
      
      // Header Premium
      doc.setFontSize(20);
      doc.setTextColor(0, 123, 255);
      doc.setFont("helvetica", "bold");
      doc.text("delivery", 14, 20);
      doc.setTextColor(33, 37, 41);
      doc.text("noazul", 40, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Restaurante: Gold Burger Delivery", 14, 28);
      doc.text("Responsável: Administrador", 14, 33);

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 37, 41);
      doc.text("FOLHA DE INVENTÁRIO", 200, 20, { align: "right" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Emissão: ${dateStr}`, 200, 28, { align: "right" });

      doc.setDrawColor(220);
      doc.line(14, 38, 200, 38);

      const tableData = items.map(item => [
        item.name,
        item.unit,
        "........................................"
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Insumo', 'Unidade', 'Contagem Física']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { fontSize: 10, cellPadding: 6, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text("Gerado por DeliveryNoAzul - Gestão Inteligente", data.settings.margin.left, pageHeight - 10);
          doc.text("Página " + doc.internal.getNumberOfPages(), data.settings.margin.left + 160, pageHeight - 10);
        }
      });

      doc.save(`Folha_Contagem_${inventoryDate}.pdf`);
      toast.success("Folha de contagem gerada com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinalize = () => {
    if (pendingItems.length > 0) {
      toast.error(`Ainda restam ${pendingItems.length} itens para contar.`);
      return;
    }

    const newClosure: ClosureHistory = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(inventoryDate).toLocaleDateString('pt-BR'),
      status: "Concluído",
      volume: countedItems.length
    };

    setHistory([newClosure, ...history]);
    setItems(MOCK_ITEMS.map(i => ({ ...i, realCount: undefined, confirmed: false })));
    setInventoryDate(new Date().toISOString().split('T')[0]);
    
    toast.success("Inventário fechado com sucesso!", {
      description: "Os dados foram arquivados na aba de Histórico.",
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight dark:text-foreground">
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
              className="border-none bg-transparent h-7 w-32 p-0 focus-visible:outline-none font-medium text-sm"
            />
          </div>
          <Button variant="outline" onClick={handleNewInventory} className="gap-2">
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
            <TabsTrigger value="pending" className="rounded-lg gap-2">
              Pendentes <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px]">{pendingItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="counted" className="rounded-lg gap-2">
              Contabilizados <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px]">{countedItems.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2">Histórico de Fechamentos</TabsTrigger>
          </TabsList>

          <Button variant="secondary" onClick={handlePrint} disabled={isExporting} className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {isExporting ? "Gerando..." : "Imprimir Folha de Contagem (PDF)"}
          </Button>
        </div>

        <TabsContent value="pending">
          <Table>
            <TableHeader className="border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-normal text-muted-foreground text-sm px-6 py-4">Insumo</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm text-center w-[200px]">Quantidade Contada</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm text-center w-[150px]">Unidade</TableHead>
                <TableHead className="text-right px-6 w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">Tudo contado!</TableCell></TableRow>
              ) : (
                pendingItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <TableCell className="px-6 py-5">
                      <span className="font-semibold text-foreground text-base">{item.name}</span>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{item.category}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Input type="number" placeholder="0.00" className="w-32 text-left h-10 text-base font-medium bg-muted/50" value={item.realCount ?? ""} onChange={(e) => handleUpdateCount(item.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleConfirm(item.id)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Select value={item.unit} onValueChange={(v) => handleUpdateUnit(item.id, v)}>
                          <SelectTrigger className="w-24 h-10 font-medium bg-muted/50"><SelectValue /></SelectTrigger>
                          <SelectContent>{UNIT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button size="icon" className="h-9 w-9 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white" onClick={() => handleConfirm(item.id)}><Check className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="counted">
          <Table>
            <TableHeader className="border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-normal text-muted-foreground text-sm px-6 py-4">Insumo</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm text-center">Qtd. Registrada</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm text-center">Unidade</TableHead>
                <TableHead className="text-right px-6 w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countedItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">Nenhum item contabilizado.</TableCell></TableRow>
              ) : (
                countedItems.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/40 bg-green-50/20 dark:bg-green-900/5">
                    <TableCell className="px-6 py-5"><span className="font-medium text-muted-foreground">{item.name}</span></TableCell>
                    <TableCell className="text-center"><span className="text-lg font-bold text-primary">{item.realCount}</span></TableCell>
                    <TableCell className="text-center text-muted-foreground font-medium uppercase text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right px-6"><Button variant="ghost" size="sm" className="gap-2" onClick={() => handleEdit(item.id)}><Pencil className="h-3.5 w-3.5" /> Editar</Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="history">
          <Table>
            <TableHeader className="border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-normal text-muted-foreground text-sm px-6 py-4">Data da Contagem</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm">Status</TableHead>
                <TableHead className="font-normal text-muted-foreground text-sm">Volume</TableHead>
                <TableHead className="text-right px-6 w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-6 py-5"><span className="font-bold text-foreground">{entry.date}</span></TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold uppercase text-[10px]">{entry.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{entry.volume} itens contados</TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Printer className="h-4 w-4" /></Button>
                    </div>
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
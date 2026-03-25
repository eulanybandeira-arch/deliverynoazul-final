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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  realCount?: number;
  confirmed: boolean;
}

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

const MOCK_ITEMS: InventoryItem[] = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", confirmed: false },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", confirmed: false },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", unit: "kg", confirmed: false },
  { id: "4", name: "Arroz Agulhinha T1", category: "Secos", unit: "kg", confirmed: false },
  { id: "5", name: "Óleo de Soja", category: "Secos", unit: "L", confirmed: false },
  { id: "6", name: "Filé de Frango", category: "Frangos", unit: "kg", confirmed: false },
];

const MOCK_HISTORY: ClosureHistory[] = [
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
  { 
    id: "h2", 
    date: "11/03/2026", 
    status: "Ajustado", 
    volume: 3,
    responsible: "João Silva",
    items: [
      { name: "Picanha Argentina", expected: 12, counted: 11.5, unit: "kg" },
      { name: "Óleo de Soja", expected: 24, counted: 24, unit: "L" },
      { name: "Filé de Frango", expected: 20, counted: 19, unit: "kg" },
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
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [history, setHistory] = useState<ClosureHistory[]>(MOCK_HISTORY);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClosure, setSelectedClosure] = useState<ClosureHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handlePrintClosure = (closure: ClosureHistory) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const discrepancies = closure.items.filter(i => i.counted !== i.expected);

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Fechamento - ${closure.date}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #007bff; }
            .info { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { bg-color: #f8f9fa; font-weight: bold; }
            .diff { font-weight: bold; }
            .negative { color: #dc3545; }
            .positive { color: #28a745; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Relatório de Fechamento de Inventário</div>
            <div class="info">
              <p><strong>Data:</strong> ${closure.date}</p>
              <p><strong>Responsável:</strong> ${closure.responsible}</p>
              <p><strong>Status:</strong> ${closure.status}</p>
            </div>
          </div>
          
          <h3>Divergências Encontradas</h3>
          ${discrepancies.length === 0 ? '<p>Nenhuma divergência registrada.</p>' : `
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Esperado</th>
                  <th>Contado</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                ${discrepancies.map(item => {
                  const diff = item.counted - item.expected;
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.expected} ${item.unit}</td>
                      <td>${item.counted} ${item.unit}</td>
                      <td class="diff ${diff < 0 ? 'negative' : 'positive'}">
                        ${diff > 0 ? '+' : ''}${diff} ${item.unit}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
          
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      volume: countedItems.length,
      responsible: "Admin",
      items: countedItems.map(i => ({
        name: i.name,
        expected: 10, // Simulado
        counted: i.realCount || 0,
        unit: i.unit
      }))
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
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-center">Quantidade Contada</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">Tudo contado!</TableCell></TableRow>
              ) : (
                pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-semibold">{item.name}</span>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.category}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Input type="number" placeholder="0.00" className="w-32" value={item.realCount ?? ""} onChange={(e) => handleUpdateCount(item.id, e.target.value)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Select value={item.unit} onValueChange={(v) => handleUpdateUnit(item.id, v)}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>{UNIT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleConfirm(item.id)}><Check className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="counted">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-center">Qtd. Registrada</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countedItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">Nenhum item contabilizado.</TableCell></TableRow>
              ) : (
                countedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><span className="font-medium">{item.name}</span></TableCell>
                    <TableCell className="text-center"><span className="text-lg font-bold text-primary">{item.realCount}</span></TableCell>
                    <TableCell className="text-center text-muted-foreground uppercase text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="history">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data da Contagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell><span className="font-bold">{entry.date}</span></TableCell>
                  <TableCell><Badge variant="outline">{entry.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{entry.volume} itens contados</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedClosure(entry);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handlePrintClosure(entry)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <ClosureDetailsModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        closure={selectedClosure} 
      />
    </div>
  );
}
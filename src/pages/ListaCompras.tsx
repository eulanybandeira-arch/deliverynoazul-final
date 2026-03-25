import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ShoppingCart, CalendarIcon, Calculator, CheckCircle2, FileText, Settings2, Loader2, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  cmd: number;
  includeLeadTime: boolean;
  finalOrder: number;
}

const MOCK_ITEMS: ShoppingItem[] = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", unit: "kg", currentStock: 12.5, cmd: 4.2, includeLeadTime: true, finalOrder: 0 },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", unit: "kg", currentStock: 8.0, cmd: 3.5, includeLeadTime: true, finalOrder: 0 },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", unit: "kg", currentStock: 15.0, cmd: 6.0, includeLeadTime: false, finalOrder: 0 },
  { id: "4", name: "Óleo de Soja", category: "Secos", unit: "L", currentStock: 24.0, cmd: 8.5, includeLeadTime: true, finalOrder: 0 },
  { id: "5", name: "Embalagem Burger G", category: "Embalagens", unit: "un", currentStock: 450, cmd: 120, includeLeadTime: true, finalOrder: 0 },
];

export default function ListaCompras() {
  const [items, setItems] = useState<ShoppingItem[]>(MOCK_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  const [globalDaysToKeep, setGlobalDaysToKeep] = useState(7);
  const [globalLeadTime, setGlobalLeadTime] = useState(2);

  const handleUpdateItem = (id: string, field: keyof ShoppingItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const calculateSuggested = (item: ShoppingItem) => {
    const effectiveLeadTime = item.includeLeadTime ? globalLeadTime : 0;
    const needed = item.cmd * (globalDaysToKeep + effectiveLeadTime);
    const suggestion = needed - item.currentStock;
    return suggestion > 0 ? Math.ceil(suggestion * 10) / 10 : 0;
  };

  const handleExportPDF = async () => {
    const orderItems = items.filter(i => i.finalOrder > 0);
    if (orderItems.length === 0) { toast.error("Defina as quantidades de compra."); return; }
    setIsExportingPDF(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const doc = new jsPDF();
      const today = format(new Date(), "dd/MM/yyyy");
      doc.setFontSize(20); doc.setTextColor(0, 123, 255); doc.setFont("helvetica", "bold"); doc.text("delivery", 14, 20);
      doc.setTextColor(33, 37, 41); doc.text("noazul", 40, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100);
      doc.text("Restaurante: Gold Burger Delivery", 14, 28); doc.text("Responsável: Administrador", 14, 33);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(33, 37, 41); doc.text("LISTA DE COMPRAS", 200, 20, { align: "right" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Emissão: ${today}`, 200, 28, { align: "right" });
      doc.setDrawColor(220); doc.line(14, 38, 200, 38);
      const tableData = orderItems.map(item => ["[  ]", item.name, item.finalOrder, item.unit]);
      autoTable(doc, {
        startY: 45, head: [['Check', 'Insumo', 'Quantidade', 'Unidade']], body: tableData, theme: 'striped',
        headStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { fontSize: 10, cellPadding: 6, textColor: [50, 50, 50] },
        columnStyles: { 0: { halign: 'center', cellWidth: 20 } },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize; const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.setFontSize(8); doc.setTextColor(150); doc.text("Gerado por DeliveryNoAzul - Gestão Inteligente", data.settings.margin.left, pageHeight - 10);
          doc.text("Página " + doc.internal.getNumberOfPages(), data.settings.margin.left + 160, pageHeight - 10);
        }
      });
      doc.save(`Pedido_Compras_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) { toast.error("Erro ao gerar PDF."); } finally { setIsExportingPDF(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">Lista de Compras Inteligente</h1>
          <p className="text-sm text-muted-foreground">Parametrize seu estoque de segurança e confirme o pedido final.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" disabled={isExportingExcel} onClick={() => toast.info("Exportação Excel em breve.")}><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</Button>
          <Button className="gap-2 shadow-md" disabled={isExportingPDF} onClick={handleExportPDF}>{isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} Finalizar e Gerar PDF</Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Dias de Cobertura Desejada</Label>
            <Input type="number" className="h-12 text-2xl text-center font-medium" value={globalDaysToKeep} onChange={(e) => setGlobalDaysToKeep(Number(e.target.value))} />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Prazo Médio de Entrega</Label>
            <Input type="number" className="h-12 text-2xl text-center font-medium" value={globalLeadTime} onChange={(e) => setGlobalLeadTime(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="border-b border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] px-4 text-center"></TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm px-4 py-4">Insumo</TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm text-center">Estoque Atual</TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm text-center">Consumo Médio (CMD)</TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm text-center w-[120px]">Somar Prazo?</TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm text-center">Sugerido</TableHead>
              <TableHead className="font-normal text-muted-foreground text-sm text-center w-[160px]">Qtd. Comprar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const suggested = calculateSuggested(item);
              return (
                <TableRow key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-4 py-4 text-center"><Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                  <TableCell className="px-4 py-4"><span className="font-bold text-foreground">{item.name}</span><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{item.category}</p></TableCell>
                  <TableCell className="text-center font-medium text-sm">{item.currentStock}</TableCell>
                  <TableCell className="text-center font-medium text-sm">{item.cmd}</TableCell>
                  <TableCell className="text-center"><div className="flex justify-center"><Switch checked={item.includeLeadTime} onCheckedChange={(checked) => handleUpdateItem(item.id, "includeLeadTime", checked)} /></div></TableCell>
                  <TableCell className="text-center">{suggested > 0 ? <span className="text-base font-bold text-primary">{suggested}</span> : <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}</TableCell>
                  <TableCell className="px-4"><div className="flex justify-center"><Input type="number" placeholder="0.0" className="w-32 text-center font-bold h-10" value={item.finalOrder || ""} onChange={(e) => handleUpdateItem(item.id, "finalOrder", Number(e.target.value))} /></div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
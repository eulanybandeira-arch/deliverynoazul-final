import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  Plus, 
  Check, 
  CheckCircle2,
  Eye,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventory";
import { ClosureDetailsModal } from "@/components/inventory/ClosureDetailsModal";
import { NewCountModal } from "@/components/inventory/NewCountModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Inventario() {
  const { items: inventoryItems, loading } = useInventory();
  const [items, setItems] = useState<any[]>([]);
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClosure, setSelectedClosure] = useState<any | null>(null);
  const [isNewCountModalOpen, setIsNewCountModalOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([
    { 
      id: "h1", 
      date: "18/03/2026", 
      status: "Concluído", 
      volume: 3,
      responsible: "Admin",
      items: [
        { name: "Picanha Argentina", expected: 10, counted: 10, unit: "kg" },
        { name: "Queijo Mussarela", expected: 5, counted: 4.8, unit: "kg" },
        { name: "Tomate Italiano", expected: 20, counted: 22, unit: "kg" }
      ]
    }
  ]);

  useEffect(() => {
    if (inventoryItems.length > 0 && items.length === 0) {
      setItems(inventoryItems.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category_logistics,
        unit: i.stock_unit || i.unit || "un",
        expected: i.current_stock,
        confirmed: false,
        realCount: undefined
      })));
    }
  }, [inventoryItems, items.length]);

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

  const handleStartNewCount = (date: string) => {
    setInventoryDate(date);
    setItems(inventoryItems.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category_logistics,
      unit: i.stock_unit || i.unit || "un",
      expected: i.current_stock,
      confirmed: false,
      realCount: undefined
    })));
    toast.success(`Nova contagem iniciada para ${new Date(date).toLocaleDateString('pt-BR')}`);
  };

  const handleFinalize = () => {
    if (pendingItems.length > 0) {
      toast.error(`Ainda restam ${pendingItems.length} itens para contar.`, {
        description: "Confirme todos os itens antes de fechar o inventário."
      });
      return;
    }

    const newHistoryEntry = {
      id: `h-${Date.now()}`,
      date: new Date(inventoryDate).toLocaleDateString('pt-BR'),
      status: "Concluído",
      volume: items.length,
      responsible: "Admin",
      items: items.map(i => ({
        name: i.name,
        expected: i.expected,
        counted: i.realCount,
        unit: i.unit
      }))
    };

    setHistory([newHistoryEntry, ...history]);
    toast.success("Inventário fechado com sucesso!");
  };

  const handleUpdateHistory = (updated: any) => {
    setHistory(prev => prev.map(h => h.id === updated.id ? updated : h));
    setSelectedClosure(updated);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    toast.success("Registro de inventário excluído.");
  };

  const generatePDF = (closure: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Relatório de Inventário de Estoque", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data: ${closure.date}`, 14, 30);
    doc.text(`Responsável: ${closure.responsible}`, 14, 35);
    doc.text(`Status: ${closure.status}`, 14, 40);
    
    // Table
    const tableData = closure.items.map((item: any) => {
      const diff = item.counted - item.expected;
      return [
        item.name,
        `${item.expected} ${item.unit}`,
        `${item.counted} ${item.unit}`,
        `${diff > 0 ? '+' : ''}${diff} ${item.unit}`
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Insumo', 'Esperado', 'Contado', 'Diferença']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 43, 91] }, // Cor primária do sistema
    });

    doc.save(`Inventario_${closure.date.replace(/\//g, '-')}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const handlePrintList = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Lista para Contagem Física de Estoque", 14, 22);
    doc.setFontSize(11);
    doc.text(`Data de Referência: ${new Date(inventoryDate).toLocaleDateString('pt-BR')}`, 14, 30);
    
    const tableData = items.map(i => [i.name, i.category, `(   ) ${i.unit}`]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Insumo', 'Categoria', 'Quantidade Contada']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 43, 91] },
    });

    doc.save(`Lista_Contagem_${inventoryDate}.pdf`);
    toast.success("Lista de contagem gerada!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="outline" className="gap-2" onClick={() => setIsNewCountModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Contagem
          </Button>
          <Button className="gap-2" onClick={handleFinalize}>
            <CheckCircle2 className="h-4 w-4" /> Fechar Inventário
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs defaultValue="pending" className="w-full">
          <div className="flex items-center justify-between w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-3">
              <TabsTrigger value="pending">Pendentes ({pendingItems.length})</TabsTrigger>
              <TabsTrigger value="counted">Contados ({countedItems.length})</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintList}>
              <FileText className="h-4 w-4" /> Gerar PDF de Contagem
            </Button>
          </div>

          <TabsContent value="pending" className="mt-6">
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
                  {pendingItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                        Todos os itens foram contados ou não há insumos cadastrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{item.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Input 
                              type="number" 
                              className="w-24 text-center font-bold" 
                              placeholder="0.00"
                              value={item.realCount ?? ""} 
                              onChange={(e) => handleUpdateCount(item.id, e.target.value)} 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-muted/30">{item.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => handleConfirm(item.id)} className="hover:text-primary">
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

          <TabsContent value="counted" className="mt-6">
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
                  {countedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground italic">
                        Nenhum item confirmado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    countedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold">{item.name}</TableCell>
                        <TableCell className="text-center font-mono font-bold text-primary">{item.realCount} {item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5 text-green-600 text-xs font-bold">
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

          <TabsContent value="history" className="mt-6">
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
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.date}</TableCell>
                      <TableCell>{h.responsible}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={h.status === "Concluído" ? "default" : "secondary"}>
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedClosure(h)} title="Visualizar e Editar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => generatePDF(h)} title="Gerar PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
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

      <NewCountModal 
        open={isNewCountModalOpen} 
        onOpenChange={setIsNewCountModalOpen} 
        onConfirm={handleStartNewCount} 
      />

      <ClosureDetailsModal 
        open={!!selectedClosure} 
        onOpenChange={(open) => !open && setSelectedClosure(null)} 
        closure={selectedClosure}
        onUpdate={handleUpdateHistory}
        onDelete={handleDeleteHistory}
      />
    </div>
  );
}
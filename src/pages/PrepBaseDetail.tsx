import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Tag, Trash2, Printer, MoreVertical, Pencil, FileText, Search, Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrepBases } from "@/hooks/usePrepBases";
import { useInventory, type InventoryItem } from "@/hooks/useInventory";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PrepBaseLabelDialog } from "@/components/prep-bases/PrepBaseLabelDialog";
import type { PrepBase, PrepBaseIngredient, PrepBaseLabel } from "@/types/prep-base";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWordmark from "@/assets/deliverynoazul-wordmark.png";

export default function PrepBaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, updatePrepBase, deletePrepBase, getIngredients, saveIngredients, getLabels, deleteLabel } = usePrepBases();
  const { items: inventoryItems } = useInventory();
  const { user } = useAuth();

  const prepBase = items.find((b) => b.id === id);
  const [activeTab, setActiveTab] = useState("ingredientes");
  const [ingredients, setIngredients] = useState<PrepBaseIngredient[]>([]);
  const [labels, setLabels] = useState<PrepBaseLabel[]>([]);
  const [instructions, setInstructions] = useState("");
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState<PrepBaseLabel | null>(null);

  // Ingredient add state
  const [searchItem, setSearchItem] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState(0);
  const [addUnit, setAddUnit] = useState("Und");
  const [addCost, setAddCost] = useState(0);

  const [yieldAmount, setYieldAmount] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [ings, lbls] = await Promise.all([getIngredients(id), getLabels(id)]);
    setIngredients(ings);
    setLabels(lbls);
  }, [id, getIngredients, getLabels]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (prepBase) {
      setInstructions(prepBase.instructions || "");
      setYieldAmount(prepBase.yield_amount || 0);
    }
  }, [prepBase]);

  if (!prepBase) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalCost = ingredients.reduce((s, i) => {
    return s + (i.used_qty / i.package_qty) * i.unit_price;
  }, 0);
  const unitCost = yieldAmount > 0 ? totalCost / yieldAmount : 0;

  const formatCurrency = (v: number) => `R$${v.toFixed(2).replace(".", ",")}`;

  const filteredInventory = inventoryItems.filter((i) =>
    i.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleSelectInventoryItem = (item: InventoryItem) => {
    setSelectedInventory(item);
    setSearchItem(item.name);
    setAddUnit(item.unit || "Und");
    setAddCost(item.unit_cost || 0);
  };

  const handleAddIngredient = () => {
    if (!searchItem || addQty <= 0) return;
    const newIng: PrepBaseIngredient = {
      id: crypto.randomUUID(),
      prep_base_id: id!,
      name: searchItem,
      inventory_item_id: selectedInventory?.id || null,
      used_qty: addQty,
      used_unit: addUnit,
      unit: selectedInventory?.unit || addUnit,
      package_qty: selectedInventory?.quantity_purchased || 1,
      unit_price: selectedInventory?.total_cost || addCost,
      loss: null,
      created_at: null,
    };
    setIngredients((prev) => [...prev, newIng]);
    setSearchItem("");
    setSelectedInventory(null);
    setAddQty(0);
    setAddCost(0);

    // Auto-save
    const allIngs = [...ingredients, newIng];
    saveIngredients(id!, allIngs.map((ing) => ({
      name: ing.name,
      inventory_item_id: ing.inventory_item_id,
      used_qty: ing.used_qty,
      used_unit: ing.used_unit || null,
      unit: ing.unit,
      package_qty: ing.package_qty,
      unit_price: ing.unit_price,
      loss: ing.loss,
    })));
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
    saveIngredients(id!, updated.map((ing) => ({
      name: ing.name,
      inventory_item_id: ing.inventory_item_id,
      used_qty: ing.used_qty,
      used_unit: ing.used_unit || null,
      unit: ing.unit,
      package_qty: ing.package_qty,
      unit_price: ing.unit_price,
      loss: ing.loss,
    })));
  };

  const handleSaveInstructions = async () => {
    await updatePrepBase(id!, { instructions });
  };

  const handleDeleteLabel = async (labelId: string) => {
    await deleteLabel(labelId);
    setLabels((prev) => prev.filter((l) => l.id !== labelId));
  };

  const handleDelete = async () => {
    if (confirm(`Excluir "${prepBase.name}"?`)) {
      await deletePrepBase(prepBase.id);
      navigate("/bases-preparo");
    }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), "dd/MM/yyyy"); } catch { return d; }
  };

  const handleDownloadFichaTecnica = async () => {
    try {
      const doc = new jsPDF();
      const exportDate = new Date().toLocaleString('pt-BR');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Brand colors
      const brandRoyal = [75, 134, 232] as const; // #4B86E8
      const brandCyan = [83, 210, 232] as const;  // #53D2E8

      // Helper to load image as base64
      const loadImage = (src: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d')!.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = src;
        });
      };

      // ── Header: Symbol + Logo left, date right ──
      let logoEndX = margin;
      try {
        const symbolData = await loadImage('/logo.png');
        doc.addImage(symbolData, 'PNG', margin, 12, 7, 7);
        logoEndX = margin + 9;
      } catch { /* skip symbol */ }
      try {
        const logoData = await loadImage(logoWordmark);
        doc.addImage(logoData, 'PNG', logoEndX, 13, 32, 5);
      } catch { /* skip wordmark */ }

      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text(`Ultima Atualizacao: ${exportDate}`, pageWidth - margin, 18, { align: 'right' });

      // ── Title bar (light brand bg) ──
      const titleBarY = 30;
      doc.setFillColor(235, 245, 255);
      doc.rect(margin, titleBarY, contentWidth * 0.65, 14, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(prepBase.name, margin + 6, titleBarY + 9.5);

      // ── Photo rectangle (right side, beside info) ──
      const photoX = margin + contentWidth * 0.67;
      const photoY = titleBarY;
      const photoW = contentWidth * 0.33;
      const photoH = 52;

      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'FD');

      if (prepBase.photo_url) {
        try {
          const photoData = await loadImage(prepBase.photo_url);
          doc.addImage(photoData, 'PNG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
        } catch { /* keep placeholder */ }
      } else {
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('Sem foto', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
      }

      // ── Info fields below title bar ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      let infoY = titleBarY + 22;
      const infoLineH = 6.5;

      const addInfoLine = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}: `, margin + 2, infoY);
        const labelW = doc.getTextWidth(`${label}: `);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 2 + labelW, infoY);
        infoY += infoLineH;
      };

      if (prepBase.shelf_life_days) addInfoLine('Validade', `${prepBase.shelf_life_days} Dia(s)`);
      if (prepBase.category) addInfoLine('Categoria', prepBase.category);
      addInfoLine('Custo Total', formatCurrency(totalCost));
      addInfoLine('Custo Unitario', `${formatCurrency(unitCost)}/${prepBase.yield_unit}`);

      // ── Divider line ──
      const dividerY = Math.max(infoY + 4, photoY + photoH + 6);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, dividerY, pageWidth - margin, dividerY);

      // ── Modo de Preparo section ──
      let currentY = dividerY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Modo de Preparo:', margin, currentY);
      currentY += 5;

      if (instructions) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const instrLines = doc.splitTextToSize(instructions, contentWidth);
        doc.text(instrLines, margin, currentY);
        currentY += instrLines.length * 4.5 + 4;
      } else {
        currentY += 6;
      }

      // ── Ingredients table ──
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`Ingredientes (Rende: ${prepBase.yield_amount} ${prepBase.yield_unit}):`, margin, currentY);
      currentY += 3;

      if (ingredients.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Item', 'Qtd', 'Custo']],
          body: ingredients.map(ing => [
            ing.name,
            `${ing.used_qty} ${ing.used_unit || ing.unit}`,
            formatCurrency((ing.used_qty / ing.package_qty) * ing.unit_price),
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: [brandRoyal[0], brandRoyal[1], brandRoyal[2]],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 4,
          },
          bodyStyles: {
            fontSize: 9.5,
            cellPadding: 4,
            textColor: [50, 50, 50],
          },
          alternateRowStyles: { fillColor: [248, 250, 255] },
          styles: {
            lineColor: [210, 210, 210],
            lineWidth: 0.3,
          },
          margin: { left: margin, right: margin },
        });
      }

      // ── Footer: page number ──
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(`1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });

      doc.save(`${prepBase.name}_FichaTecnica_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Ficha tecnica baixada com sucesso!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Erro ao gerar a ficha tecnica");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/bases-preparo")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Detalhes do Item / <span className="font-medium text-foreground">{prepBase.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowLabelDialog(true)}>
              <Tag className="h-4 w-4 mr-2" /> Nova Etiqueta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadFichaTecnica}>
              <FileText className="h-4 w-4 mr-2" /> Ficha Técnica
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
              <TabsTrigger value="modo-preparo">Modo de Preparo</TabsTrigger>
              <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
            </TabsList>

            <TabsContent value="ingredientes" className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">Lista de Ingredientes</h2>

              {/* Add ingredient */}
              <div className="border rounded-lg p-3">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end text-sm">
                  <div>
                    <Label className="text-xs">Item</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Pesquise por itens..."
                        value={searchItem}
                        onChange={(e) => { setSearchItem(e.target.value); setSelectedInventory(null); }}
                        className="pl-7 h-9 text-sm"
                      />
                    </div>
                    {searchItem && !selectedInventory && filteredInventory.length > 0 && (
                      <div className="absolute z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredInventory.slice(0, 8).map((inv) => (
                          <button key={inv.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent" onClick={() => handleSelectInventoryItem(inv)}>
                            {inv.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={addQty || ""} onChange={(e) => setAddQty(Number(e.target.value))} className="w-20 h-9 text-sm" />
                      <span className="text-xs text-muted-foreground">{addUnit}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Custo</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">R$</span>
                      <Input type="number" value={addCost || ""} onChange={(e) => setAddCost(Number(e.target.value))} className="w-20 h-9 text-sm" readOnly={!!selectedInventory} />
                    </div>
                  </div>
                  <Button size="icon" className="h-9 w-9" onClick={handleAddIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Ingredient list */}
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">{ing.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{ing.used_qty} {ing.used_unit || ing.unit}</span>
                    <span className="text-sm font-medium">{formatCurrency((ing.used_qty / ing.package_qty) * ing.unit_price)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Yield + Costs */}
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between pt-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold">Quanto Rende?</h4>
                  <p className="text-xs text-muted-foreground mb-2">Informe quanto essa receita irá render em média após o preparo.</p>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={yieldAmount || ""} onChange={(e) => {
                      const v = Number(e.target.value);
                      setYieldAmount(v);
                      updatePrepBase(id!, { yield_amount: v, total_cost: totalCost, unit_cost: v > 0 ? totalCost / v : 0 });
                    }} className="w-32" />
                    <span className="text-sm text-muted-foreground">{prepBase.yield_unit}</span>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Custo Total:</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">Custo Unitário:</span>
                    <span className="font-bold text-lg">{formatCurrency(unitCost)} / {prepBase.yield_unit}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modo-preparo" className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">Modo de Preparo</h2>
              <Textarea
                placeholder="Escreva o modo de preparo deste item..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[200px]"
              />
              <button onClick={handleSaveInstructions} className="text-sm text-primary font-medium flex items-center gap-1">
                ✓ Salvar
              </button>
            </TabsContent>

            <TabsContent value="etiquetas" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Etiquetas em Uso ({labels.length})</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="oldest">
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oldest">Mais Antigo (Validade)</SelectItem>
                      <SelectItem value="newest">Mais Recente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setShowLabelDialog(true)}>
                    <Tag className="h-4 w-4 mr-1" /> Nova Etiqueta
                  </Button>
                </div>
              </div>

              {labels.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Ops... Nada aqui!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {labels.map((label) => (
                    <Card key={label.id}>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h4 className="font-bold">{label.quantity_produced} {label.production_unit}</h4>
                          <p className="text-xs text-muted-foreground">
                            {label.code} • Criado em {formatDate(label.created_at)}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Responsável:</span>
                            <span className="font-medium">{label.responsible}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Produção:</span>
                            <span>{formatDate(label.production_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data de Validade</span>
                            <span>{formatDate(label.expiry_date)}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteLabel(label.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPrintDialog(label)}>
                            <Printer className="h-4 w-4 mr-1" /> Imprimir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
                {prepBase.photo_url ? (
                  <img src={prepBase.photo_url} alt={prepBase.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{prepBase.name}</h3>
                {prepBase.category && (
                  <span className="text-sm text-primary font-medium">{prepBase.category}</span>
                )}
                <p className="text-sm text-muted-foreground mt-1">{prepBase.description}</p>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" onClick={handleDownloadFichaTecnica}>
                <FileText className="h-4 w-4 mr-2" /> Baixar Ficha Técnica
              </Button>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Prazo de Validade Padrão</p>
                  <p className="text-sm text-muted-foreground">{prepBase.shelf_life_days || 0} Dia(s)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Última Entrada</p>
                  <p className="text-sm text-muted-foreground">{formatDate(prepBase.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Label Dialog */}
      {showLabelDialog && (
        <PrepBaseLabelDialog
          open={showLabelDialog}
          onClose={() => setShowLabelDialog(false)}
          prepBase={prepBase}
          onCreated={loadData}
        />
      )}

      {/* Print Preview Dialog */}
      {showPrintDialog && (
        <Dialog open={!!showPrintDialog} onOpenChange={() => setShowPrintDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Baixar Etiqueta</DialogTitle></DialogHeader>
            <div className="border rounded-lg p-4 bg-card/50 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pré-visualização (60mm × 40mm)</p>
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-lg">{prepBase.name}</h4>
                <span className="font-bold">{showPrintDialog.quantity_produced} {showPrintDialog.production_unit}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Responsável:</span>
                <span className="font-medium">{showPrintDialog.responsible}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Produção:</span>
                <span>{formatDate(showPrintDialog.production_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data de Validade:</span>
                <span>{formatDate(showPrintDialog.expiry_date)}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground text-center">
                {showPrintDialog.code} • Por deliverynoazul
              </p>
            </div>
            <Button className="w-full" onClick={async () => {
              const label = showPrintDialog;
              if (!label || !user) return;

              // Try to load the restaurant logo from business_identity
              let restaurantLogoB64: string | null = null;
              try {
                const { data: biz } = await supabase
                  .from("business_identity")
                  .select("logo_url")
                  .eq("user_id", user.id)
                  .maybeSingle();
                if (biz?.logo_url) {
                  const img = new Image();
                  img.crossOrigin = "anonymous";
                  await new Promise<void>((resolve) => {
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = img.width;
                      canvas.height = img.height;
                      canvas.getContext("2d")!.drawImage(img, 0, 0);
                      restaurantLogoB64 = canvas.toDataURL("image/png");
                      resolve();
                    };
                    img.onerror = () => resolve();
                    img.src = biz.logo_url;
                  });
                }
              } catch { /* ignore */ }

              const { default: jsPDF } = await import("jspdf");
              const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [40, 60] });
              const w = 60;
              const h = 40;
              const m = 3;
              const innerW = w - m * 2;

              // Border rectangle
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.3);
              doc.rect(m - 1, 1, innerW + 2, h - 2);

              // --- Restaurant logo area (top-left, 10x8mm) ---
              const logoAreaX = m;
              const logoAreaY = 2.5;
              const logoAreaW = 10;
              const logoAreaH = 8;

              if (restaurantLogoB64) {
                doc.addImage(restaurantLogoB64, "PNG", logoAreaX, logoAreaY, logoAreaW, logoAreaH);
              } else {
                // Placeholder dashed box
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(0.15);
                doc.setLineDashPattern([0.8, 0.5], 0);
                doc.rect(logoAreaX, logoAreaY, logoAreaW, logoAreaH);
                doc.setLineDashPattern([], 0);
                doc.setFontSize(3.5);
                doc.setTextColor(160, 160, 160);
                doc.text("LOGO", logoAreaX + logoAreaW / 2, logoAreaY + logoAreaH / 2 + 1, { align: "center" });
              }

              // Product name (to the right of logo)
              const nameX = logoAreaX + logoAreaW + 2;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.setTextColor(0, 0, 0);
              const nameMaxW = w - m - nameX - 15;
              const nameLines = doc.splitTextToSize(prepBase.name, nameMaxW > 10 ? nameMaxW : 20);
              doc.text(nameLines, nameX, 6);

              // Quantity (top-right, bold)
              doc.setFont("helvetica", "bold");
              doc.setFontSize(10);
              doc.text(`${label.quantity_produced} ${label.production_unit}`, w - m, 6, { align: "right" });

              // Horizontal line after header
              const headerLineY = 12;
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.3);
              doc.line(m - 1, headerLineY, w - m + 1, headerLineY);

              // Info rows
              let y = headerLineY + 4.5;
              const lineH = 5;

              const addRow = (lbl: string, val: string, showLine = true) => {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                doc.setTextColor(0, 0, 0);
                doc.text(`${lbl}:`, m, y);
                doc.setFont("helvetica", "normal");
                doc.text(val, w - m, y, { align: "right" });
                if (showLine) {
                  doc.setDrawColor(210, 210, 210);
                  doc.setLineWidth(0.15);
                  doc.line(m - 1, y + 1.8, w - m + 1, y + 1.8);
                }
                y += lineH;
              };

              addRow("Responsável", label.responsible);
              addRow("Data Produção", formatDate(label.production_date));
              addRow("Data de Validade", formatDate(label.expiry_date), false);

              // Bottom separator (thicker)
              y += 0.5;
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.3);
              doc.line(m - 1, y, w - m + 1, y);

              // Footer
              y += 3;
              doc.setFont("helvetica", "normal");
              doc.setFontSize(5);
              doc.setTextColor(80, 80, 80);
              const printedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
              doc.text(`Impresso em ${printedAt} • Por deliverynoazul • ${label.code}`, w / 2, y, { align: "center" });

              doc.save(`etiqueta-${prepBase.name.replace(/\s+/g, "-").toLowerCase()}-${label.code}.pdf`);
            }}>
              <Printer className="h-4 w-4 mr-1" /> Baixar Etiqueta (60×40mm)
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

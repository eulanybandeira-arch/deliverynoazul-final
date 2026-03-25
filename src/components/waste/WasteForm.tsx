import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Layers } from "lucide-react";
import type { PrepBase } from "@/types/prep-base";

const DEFAULT_REASONS = [
  { id: "pedido-errado", label: "Pedido Errado (Salão)" },
  { id: "pedido-errado-delivery", label: "Pedido Errado (Delivery)" },
  { id: "devolucao", label: "Devolução de Cliente" },
  { id: "devolucao-delivery", label: "Devolução Delivery" },
  { id: "vencimento", label: "Vencimento (Estoque)" },
  { id: "etiqueta-vencida", label: "Etiqueta Vencida (Base de Preparo)" },
  { id: "excesso", label: "Excesso de Produção (Bases)" },
  { id: "erro-coccao", label: "Erro de Cocção" },
  { id: "queda", label: "Queda / Dano" },
];

export interface WasteFormPrefill {
  sourceType: "estoque" | "base" | "manual";
  selectedId?: string | null;
  itemName: string;
  quantity: string;
  unit: string;
  unitCost: string;
  reasonKey: string;
  notes?: string;
}

interface WasteFormProps {
  open: boolean;
  onClose: () => void;
  inventoryItems: { id: string; name: string; unit: string; unit_cost: number | null }[];
  prepBases: PrepBase[];
  onSave: (data: any) => Promise<void>;
  userId: string;
  prefill?: WasteFormPrefill | null;
}

type SourceType = "estoque" | "base" | "manual";

export function WasteForm({ open, onClose, inventoryItems, prepBases, onSave, userId, prefill }: WasteFormProps) {
  const [sourceType, setSourceType] = useState<SourceType | null>(prefill?.sourceType ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(prefill?.selectedId ?? null);
  const [itemName, setItemName] = useState(prefill?.itemName ?? "");
  const [quantity, setQuantity] = useState(prefill?.quantity ?? "");
  const [unit, setUnit] = useState(prefill?.unit ?? "un");
  const [unitCost, setUnitCost] = useState(prefill?.unitCost ?? "");
  const [reasonKey, setReasonKey] = useState(prefill?.reasonKey ?? "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState(prefill?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    if (!q) return [];
    const inv = inventoryItems
      .filter((i) => i.name.toLowerCase().includes(q))
      .map((i) => ({ ...i, source: "estoque" as const }));
    const bases = prepBases
      .filter((b) => b.name.toLowerCase().includes(q))
      .map((b) => ({ id: b.id, name: b.name, unit: b.yield_unit, unit_cost: b.unit_cost, source: "base" as const }));
    return [...inv, ...bases];
  }, [inventoryItems, prepBases, productSearch]);

  const handleSelect = (id: string, source: SourceType) => {
    if (source === "estoque") {
      const item = inventoryItems.find((i) => i.id === id);
      if (item) {
        setSelectedId(item.id);
        setSourceType("estoque");
        setItemName(item.name);
        setUnit(item.unit || "un");
        setUnitCost(String(item.unit_cost || 0));
      }
    } else if (source === "base") {
      const base = prepBases.find((b) => b.id === id);
      if (base) {
        setSelectedId(base.id);
        setSourceType("base");
        setItemName(base.name);
        setUnit(base.yield_unit || "Kg");
        setUnitCost(String(base.unit_cost || 0));
      }
    }
    setProductSearch("");
  };

  const handleManual = () => {
    setSourceType("manual");
    setSelectedId(null);
    setItemName("");
    setUnit("un");
    setUnitCost("");
    setProductSearch("");
  };

  const handleReset = () => {
    setSourceType(null);
    setSelectedId(null);
    setItemName("");
    setProductSearch("");
  };

  const handleSubmit = async () => {
    if (!itemName.trim() || !quantity || !reasonKey) return;
    setSaving(true);
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    const reason = DEFAULT_REASONS.find((r) => r.id === reasonKey);

    const prefix = sourceType === "base" ? "[Base] " : "";
    await onSave({
      user_id: userId,
      inventory_item_id: sourceType === "estoque" ? selectedId : null,
      item_name: prefix + itemName.trim(),
      quantity: qty,
      unit,
      unit_cost: cost,
      total_cost: qty * cost,
      reason_id: null,
      reason_text: reason?.label || reasonKey,
      date,
      notes: notes.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Desperdício</DialogTitle>
          <DialogDescription>Selecione o item desperdiçado e preencha os dados.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unified product search — one-click select */}
          <div>
            <Label>Produto <span className="text-destructive">*</span></Label>
            {sourceType && (sourceType === "manual" || selectedId) ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 mt-1">
                {sourceType === "estoque" ? (
                  <Package className="h-4 w-4 text-blue-400" />
                ) : sourceType === "base" ? (
                  <Layers className="h-4 w-4 text-amber-400" />
                ) : null}
                {sourceType === "manual" ? (
                  <Input
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Nome do item"
                    className="border-0 p-0 h-auto focus-visible:ring-0"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{itemName}</span>
                )}
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {sourceType === "estoque" ? "Estoque" : sourceType === "base" ? "Base" : "Manual"}
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleReset}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="relative mt-1">
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Busque no Estoque ou Bases de Preparo..."
                  autoFocus
                />
                {productSearch.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        Nenhum resultado
                        <Button variant="link" size="sm" className="block mx-auto mt-1" onClick={handleManual}>
                          Digitar manualmente
                        </Button>
                      </div>
                    ) : (
                      <>
                        {filteredProducts.map((p) => (
                          <button
                            key={`${p.source}-${p.id}`}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                            onClick={() => handleSelect(p.id, p.source)}
                          >
                            {p.source === "estoque" ? (
                              <Package className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            ) : (
                              <Layers className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            )}
                            <span className="flex-1 truncate">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {p.unit_cost ? `R$ ${Number(p.unit_cost).toFixed(2)}/${p.unit}` : ""}
                            </span>
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {p.source === "estoque" ? "Estoque" : "Base"}
                            </Badge>
                          </button>
                        ))}
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent border-t"
                          onClick={handleManual}
                        >
                          Digitar manualmente...
                        </button>
                      </>
                    )}
                  </div>
                )}
                {productSearch.length === 0 && (
                  <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" onClick={handleManual}>
                    Ou digitar manualmente
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Quantidade <span className="text-destructive">*</span></Label>
              <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div>
              <Label>Custo Unit. (R$)</Label>
              <Input type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
          </div>

          {/* Required reason dropdown */}
          <div>
            <Label>Motivo <span className="text-destructive">*</span></Label>
            <Select value={reasonKey} onValueChange={setReasonKey}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_REASONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional..." rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !itemName.trim() || !quantity || !reasonKey}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

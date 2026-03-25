import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePrepBases } from "@/hooks/usePrepBases";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { PrepBase } from "@/types/prep-base";
import { format, addDays } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  prepBase?: PrepBase;
  onCreated?: () => void;
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "#";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd/MM/yyyy"); }
  catch { return d; }
};

function openPrintWindow(opts: {
  baseName: string;
  responsible: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  code: string;
  logoUrl: string | null;
}) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  const printedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Etiqueta ${esc(opts.baseName)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#f5f5f5}
    body{min-height:100vh;display:grid;place-items:center;padding:24px}
    .hint{font-size:13px;color:#888;margin-bottom:12px;text-align:center}
    .label{
      width:226px;height:151px;
      background:#fff;border:1.5px solid #222;
      padding:10px 12px;
      display:flex;flex-direction:column;
    }
    .header{display:flex;align-items:flex-start;gap:8px}
    .logo{width:38px;height:30px;border:1px dashed #aaa;display:grid;place-items:center;font-size:7px;color:#999;overflow:hidden;flex-shrink:0}
    .logo img{width:100%;height:100%;object-fit:contain}
    .title-wrap{flex:1;min-width:0;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
    .title{font-size:12px;font-weight:700;line-height:1.1;word-break:break-word}
    .qty{font-size:12px;font-weight:700;white-space:nowrap}
    .divider{border-top:1.5px solid #222;margin-top:6px}
    .rows{padding:6px 0 4px;flex:1;display:flex;flex-direction:column;justify-content:center;gap:0}
    .row{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:9px;border-bottom:1px solid #e0e0e0}
    .row:last-child{border-bottom:0}
    .row b{font-weight:700}
    .footer{border-top:1.5px solid #222;padding-top:5px;text-align:center;font-size:6.5px;color:#888;line-height:1.2}
    @page{size:60mm 40mm;margin:0}
    @media print{
      html,body{background:#fff;width:60mm;height:40mm;overflow:hidden;padding:0;min-height:auto;display:block}
      .hint{display:none}
      .label{width:60mm;height:40mm;border-width:0.3mm;padding:3mm}
      .logo{width:10mm;height:8mm}
      .title{font-size:10px}
      .qty{font-size:10px}
      .row{font-size:7px;padding:1.2mm 0}
      .footer{font-size:5px;padding-top:2mm}
    }
  </style>
</head>
<body>
  <p class="hint">A prévia de impressão abrirá automaticamente.</p>
  <div class="label">
    <div class="header">
      <div class="logo">${opts.logoUrl ? `<img src="${opts.logoUrl}" alt="Logo"/>` : "LOGO"}</div>
      <div class="title-wrap">
        <div class="title">${esc(opts.baseName)}</div>
        <div class="qty">${opts.quantity} ${esc(opts.unit)}</div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="rows">
      <div class="row"><b>Responsável:</b><span>${esc(opts.responsible)}</span></div>
      <div class="row"><b>Data Produção:</b><span>${formatDate(opts.productionDate)}</span></div>
      <div class="row"><b>Data de Validade:</b><span>${formatDate(opts.expiryDate)}</span></div>
    </div>
    <div class="footer">Impresso em ${printedAt} • Por deliverynoazul • ${esc(opts.code)}</div>
  </div>
  <script>
    window.addEventListener('load',()=>{window.focus();setTimeout(()=>window.print(),300)});
    window.addEventListener('afterprint',()=>window.close());
  </script>
</body>
</html>`);
  printWindow.document.close();
}

export function PrepBaseLabelDialog({ open, onClose, prepBase, onCreated }: Props) {
  const { user } = useAuth();
  const { items, createLabel } = usePrepBases();
  const [selectedPrepBaseId, setSelectedPrepBaseId] = useState(prepBase?.id || "");
  const [responsible, setResponsible] = useState(user?.email?.split("@")[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [productionDate, setProductionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiryDate, setExpiryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const selectedBase = items.find((b) => b.id === selectedPrepBaseId) || prepBase;

  useEffect(() => {
    if (selectedBase?.shelf_life_days) {
      const prodDate = new Date(productionDate);
      setExpiryDate(format(addDays(prodDate, selectedBase.shelf_life_days), "yyyy-MM-dd"));
    }
  }, [selectedPrepBaseId, productionDate, selectedBase?.shelf_life_days]);

  const handleSaveAndPrint = async () => {
    if (!user || !selectedPrepBaseId) return;
    setSaving(true);

    const code = generateCode();
    const result = await createLabel({
      prep_base_id: selectedPrepBaseId,
      user_id: user.id,
      responsible,
      quantity_produced: quantity,
      production_unit: selectedBase?.yield_unit || "Kg",
      production_date: productionDate,
      expiry_date: expiryDate,
      code,
    });

    if (result) {
      // Fetch logo
      let logoUrl: string | null = null;
      try {
        const { data: biz } = await supabase
          .from("business_identity")
          .select("logo_url")
          .eq("user_id", user.id)
          .maybeSingle();
        logoUrl = biz?.logo_url || null;
      } catch {
        // ignore
      }

      // Open print window BEFORE closing dialog to avoid popup blocker issues
      onCreated?.();
      onClose();

      // Small delay so the dialog closes cleanly before the print window takes focus
      setTimeout(() => {
        openPrintWindow({
          baseName: selectedBase?.name || "",
          responsible,
          quantity,
          unit: selectedBase?.yield_unit || "Kg",
          productionDate,
          expiryDate,
          code,
          logoUrl,
        });
      }, 150);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Etiqueta</DialogTitle>
          <DialogDescription>Preencha os dados e clique em Salvar e Imprimir.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!prepBase?.id && (
            <div>
              <Label>Receita</Label>
              <Select value={selectedPrepBaseId} onValueChange={setSelectedPrepBaseId}>
                <SelectTrigger><SelectValue placeholder="Pesquise por itens..." /></SelectTrigger>
                <SelectContent>
                  {items.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Responsável</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} />
          </div>

          <div>
            <Label>Qtd. Produzida</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="flex items-center text-sm text-muted-foreground">
                {selectedBase?.yield_unit || "Und"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Data Produção</Label>
                <button
                  className="text-xs text-primary font-medium"
                  onClick={() => setProductionDate(format(new Date(), "yyyy-MM-dd"))}
                >
                  Hoje
                </button>
              </div>
              <Input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Data de Validade</Label>
                {selectedBase?.shelf_life_days && (
                  <span className="text-xs text-primary font-medium">{selectedBase.shelf_life_days} Dia(s)</span>
                )}
              </div>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {selectedBase?.shelf_life_days && (
            <p className="text-xs text-muted-foreground">
              OBS: O prazo de validade padrão do item selecionado é de <strong>{selectedBase.shelf_life_days} Dia(s)</strong>.
            </p>
          )}

          {/* Label Preview */}
          <div className="border rounded-lg p-4 bg-card/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Pré-visualização</p>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-lg">{selectedBase?.name || "Selecione uma receita"}</h4>
                <span className="font-bold">{quantity} {selectedBase?.yield_unit || "Und"}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Responsável:</span>
                <span className="font-medium">{responsible}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Produção:</span>
                <span className="font-medium">{formatDate(productionDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data de Validade:</span>
                <span className="font-medium">{formatDate(expiryDate)}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground text-center">
                Impresso em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")} • Por deliverynoazul
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={handleSaveAndPrint} disabled={!selectedPrepBaseId || saving}>
            {saving ? "Salvando..." : "Salvar e Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

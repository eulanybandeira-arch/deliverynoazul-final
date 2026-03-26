import { useState, useMemo, useEffect, useRef } from "react";
import { Trash2, Plus, TrendingDown, AlertTriangle, Hash, Package, Layers, CalendarIcon, Weight, Clock, Camera, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWaste } from "@/hooks/useWaste";
import { useInventory } from "@/hooks/useInventory";
import { usePrepBases } from "@/hooks/usePrepBases";
import { supabase } from "@/integrations/supabase/client";
import { WasteForm, type WasteFormPrefill } from "@/components/waste/WasteForm";
import { WasteReasonsDialog } from "@/components/waste/WasteReasonsDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

export default function Desperdicios() {
  const { user } = useAuth();
  const { entries, reasons, isLoading, addEntry, deleteEntry, addReason, deleteReason } = useWaste();
  const { items: inventoryItems } = useInventory();
  const { items: prepBases } = usePrepBases();
  const [showForm, setShowForm] = useState(false);
  const [formPrefill, setFormPrefill] = useState<WasteFormPrefill | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [trashWeight, setTrashWeight] = useState("");
  const [trashCostPerKg, setTrashCostPerKg] = useState("5.00");
  const [trashShift, setTrashShift] = useState("almoco");
  const [savingTrash, setSavingTrash] = useState(false);

  const handleTrashRegister = async () => {
    if (!trashWeight || !user) return;
    setSavingTrash(true);
    const weight = parseFloat(trashWeight) || 0;
    const costPerKg = parseFloat(trashCostPerKg) || 0;
    const shiftLabel = trashShift === "almoco" ? "Almoço" : "Jantar";
    const estimatedCost = weight * costPerKg;
    
    await addEntry({
      user_id: user.id,
      inventory_item_id: null,
      item_name: `[Lixo] Pesagem do Turno - ${shiftLabel}`,
      quantity: weight,
      unit: "Kg",
      unit_cost: costPerKg,
      total_cost: estimatedCost,
      reason_id: null,
      reason_text: "Descarte Orgânico",
      date: new Date().toISOString().split("T")[0],
      notes: `Turno: ${shiftLabel}`,
    });
    
    setTrashWeight("");
    setSavingTrash(false);
    toast.success("Pesagem de lixo registrada!");
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch = e.item_name.toLowerCase().includes(search.toLowerCase());
      const matchReason = reasonFilter === "all" || e.reason_text === reasonFilter;
      return matchSearch && matchReason;
    });
  }, [entries, search, reasonFilter]);

  const totalCost = useMemo(() => filtered.reduce((s, e) => s + e.total_cost, 0), [filtered]);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Desperdícios</h1>
            <p className="text-sm text-muted-foreground">
              Controle as perdas da sua operação para reduzir o impacto no seu CMV.
            </p>
          </div>
        </div>
        <Button onClick={() => { setFormPrefill(null); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🗑️</span>
            <h3 className="font-semibold text-sm uppercase tracking-wide">Pesagem de Lixo do Turno</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peso Total (Kg)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 4.5"
                value={trashWeight}
                onChange={(e) => setTrashWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Custo Médio (R$/Kg)</label>
              <Input
                type="number"
                step="0.01"
                value={trashCostPerKg}
                onChange={(e) => setTrashCostPerKg(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Turno</label>
              <Select value={trashShift} onValueChange={setTrashShift}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="almoco">☀️ Almoço</SelectItem>
                  <SelectItem value="jantar">🌙 Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTrashRegister} disabled={savingTrash || !trashWeight}>
              {savingTrash ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold">Custo Total de Perdas</p>
            <p className="text-2xl font-black text-destructive">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-bold">{entry.item_name}</TableCell>
                  <TableCell>{entry.quantity} {entry.unit}</TableCell>
                  <TableCell className="font-bold text-destructive">{formatCurrency(entry.total_cost)}</TableCell>
                  <TableCell className="text-sm">{entry.reason_text}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && user && (
        <WasteForm
          open={showForm}
          onClose={() => setShowForm(false)}
          inventoryItems={inventoryItems.map((i) => ({
            id: i.id,
            name: i.name,
            unit: i.unit || i.stock_unit || "un",
            unit_cost: i.unit_cost,
          }))}
          prepBases={prepBases}
          onSave={addEntry}
          userId={user.id}
          prefill={formPrefill}
        />
      )}
    </div>
  );
}
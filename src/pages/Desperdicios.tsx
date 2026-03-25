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

const DEFAULT_REASON_LABELS = [
  "Pedido Errado (Salão)",
  "Pedido Errado (Delivery)",
  "Devolução de Cliente",
  "Devolução Delivery",
  "Vencimento (Estoque)",
  "Etiqueta Vencida (Base de Preparo)",
  "Excesso de Produção (Bases)",
  "Erro de Cocção",
  "Queda / Dano",
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
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [trashWeight, setTrashWeight] = useState("");
  const [trashCostPerKg, setTrashCostPerKg] = useState("5.00");
  const [trashShift, setTrashShift] = useState("almoco");
  const [savingTrash, setSavingTrash] = useState(false);
  const [isExtractingWeight, setIsExtractingWeight] = useState(false);
  const [trashPhotoUrl, setTrashPhotoUrl] = useState<string | null>(null);
  const trashFileRef = useRef<HTMLInputElement>(null);
  const [dismissedExpiredIds, setDismissedExpiredIds] = useState<Set<string>>(new Set());
  const [expiredLabels, setExpiredLabels] = useState<{ id: string; name: string; expiry_date: string; type: "label" }[]>([]);

  // Fetch expired prep base labels
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("prep_base_labels")
      .select("id, expiry_date, prep_base_id")
      .eq("user_id", user.id)
      .lte("expiry_date", today)
      .then(async ({ data }) => {
        if (!data || data.length === 0) {
          setExpiredLabels([]);
          return;
        }
        const baseIds = [...new Set(data.map((l: any) => l.prep_base_id))];
        const { data: bases } = await supabase
          .from("prep_bases")
          .select("id, name")
          .in("id", baseIds);
        const nameMap: Record<string, string> = {};
        (bases || []).forEach((b: any) => {
          nameMap[b.id] = b.name;
        });
        setExpiredLabels(
          data.map((l: any) => ({
            id: l.id,
            name: nameMap[l.prep_base_id] || "Base desconhecida",
            expiry_date: l.expiry_date,
            type: "label" as const,
          }))
        );
      });
  }, [user]);

  const registeredExpiredInventoryIds = useMemo(() => {
    return new Set(
      entries
        .filter((entry) => entry.reason_text === "Vencimento (Estoque)" && entry.inventory_item_id)
        .map((entry) => entry.inventory_item_id as string)
    );
  }, [entries]);

  const registeredExpiredLabelKeys = useMemo(() => {
    return new Set(
      entries
        .filter(
          (entry) =>
            entry.reason_text === "Etiqueta Vencida (Base de Preparo)" ||
            (entry.item_name.startsWith("[Base] ") && entry.notes?.startsWith("Etiqueta vencida em "))
        )
        .map((entry) => {
          const cleanName = entry.item_name.replace(/^\[Base\] /, "");
          const expiryMatch = entry.notes?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
          return `${cleanName}::${expiryMatch}`;
        })
    );
  }, [entries]);

  // Expired inventory items (excluding already-registered ones)
  const expiredInventory = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return inventoryItems.filter(
      (i) =>
        i.expiry_date &&
        i.expiry_date <= today &&
        i.current_stock > 0 &&
        !dismissedExpiredIds.has(`inv-${i.id}`) &&
        !registeredExpiredInventoryIds.has(i.id)
    );
  }, [inventoryItems, dismissedExpiredIds, registeredExpiredInventoryIds]);

  const visibleExpiredLabels = useMemo(() => {
    return expiredLabels.filter(
      (l) => !dismissedExpiredIds.has(`label-${l.id}`) && !registeredExpiredLabelKeys.has(`${l.name}::${l.expiry_date}`)
    );
  }, [expiredLabels, dismissedExpiredIds, registeredExpiredLabelKeys]);

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
      notes: trashPhotoUrl
        ? `Turno: ${shiftLabel} | Foto: ${trashPhotoUrl}`
        : `Turno: ${shiftLabel}`,
    });
    setTrashWeight("");
    setTrashPhotoUrl(null);
    setSavingTrash(false);
  };

  const handleTrashPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setTrashPhotoUrl(url);
    
    // Start AI extraction
    setIsExtractingWeight(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const { data, error } = await supabase.functions.invoke("read-scale-image", {
          body: { imageBase64: base64 },
        });
        
        if (error) throw error;
        
        if (data?.weight) {
          setTrashWeight(String(data.weight));
          toast.success(`Peso extraído: ${data.weight}${data.unit || 'Kg'}`);
        } else if (data?.error) {
          toast.error(data.error);
        }
      };
    } catch (err) {
      console.error("Error extracting weight:", err);
      toast.error("Erro ao extrair peso da imagem");
    } finally {
      setIsExtractingWeight(false);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (periodFilter === "7d") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (periodFilter === "15d") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15);
    } else if (periodFilter === "30d") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    } else if (periodFilter === "custom") {
      fromDate = customDateFrom;
      toDate = customDateTo;
    }

    return entries
      .filter((e) => {
        const matchSearch = e.item_name.toLowerCase().includes(search.toLowerCase());
        const matchReason = reasonFilter === "all" || e.reason_text === reasonFilter;
        const entryDate = new Date(e.date + "T12:00:00");
        const matchFrom = !fromDate || entryDate >= fromDate;
        const matchTo = !toDate || entryDate <= toDate;
        return matchSearch && matchReason && matchFrom && matchTo;
      })
      .sort((a, b) => a.item_name.localeCompare(b.item_name, "pt-BR"));
  }, [entries, search, reasonFilter, periodFilter, customDateFrom, customDateTo]);

  const totalCost = useMemo(() => filtered.reduce((s, e) => s + e.total_cost, 0), [filtered]);
  const totalCount = filtered.length;

  const topReason = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      const key = e.reason_text || "Sem motivo";
      map[key] = (map[key] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "—";
  }, [filtered]);

  // Area chart: cost trend over time (daily aggregation)
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.date] = (map[e.date] || 0) + e.total_cost;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: format(new Date(date + "T12:00:00"), "dd/MM", { locale: ptBR }),
        value,
      }));
  }, [filtered]);

  // Donut chart: reason distribution
  const reasonChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      const key = e.reason_text || "Sem motivo";
      map[key] = (map[key] || 0) + e.total_cost;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const allReasonTexts = useMemo(() => {
    const set = new Set<string>(DEFAULT_REASON_LABELS);
    entries.forEach((e) => { if (e.reason_text) set.add(e.reason_text); });
    return Array.from(set).sort();
  }, [entries]);

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const getOrigin = (entry: typeof entries[0]): { label: string; type: "estoque" | "base" | "lixo" | "manual" } => {
    if (entry.item_name.startsWith("[Lixo] ")) return { label: "Lixo do Turno", type: "lixo" };
    if (entry.item_name.startsWith("[Base] ")) return { label: "Base de Preparo", type: "base" };
    if (entry.inventory_item_id) return { label: "Estoque", type: "estoque" };
    return { label: "Manual", type: "manual" };
  };

  const getCleanName = (name: string) => name.replace(/^\[(Base|Lixo)\] /, "");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteEntry(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-destructive/10 p-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Desperdícios</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Controle as perdas da sua operação. Identifique tendências, entenda os motivos e reduza o impacto no seu CMV.
            </p>
          </div>
        </div>
        <Button onClick={() => { setFormPrefill(null); setShowForm(true); }} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Novo Registro
        </Button>
      </div>

       <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🗑️</span>
            <h3 className="font-semibold text-sm uppercase tracking-wide">Pesagem de Lixo do Turno</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">Rápido</Badge>
          </div>
          <input
            ref={trashFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleTrashPhoto}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peso Total (Kg)</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 4.5"
                  value={trashWeight}
                  onChange={(e) => setTrashWeight(e.target.value)}
                  className="text-lg font-semibold pr-8"
                  disabled={isExtractingWeight}
                />
                {isExtractingWeight && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </div>
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
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => trashFileRef.current?.click()}
                disabled={isExtractingWeight}
                title="Foto da balança para extrair peso"
              >
                {isExtractingWeight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleTrashRegister}
                disabled={savingTrash || !trashWeight || isExtractingWeight}
                className="flex-1"
              >
                <Weight className="mr-2 h-4 w-4" />
                {savingTrash ? "..." : "Registrar"}
              </Button>
            </div>
          </div>
          {trashWeight && parseFloat(trashWeight) > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Custo estimado: <span className="text-destructive font-semibold">R$ {(parseFloat(trashWeight) * (parseFloat(trashCostPerKg) || 0)).toFixed(2).replace(".", ",")}</span>
            </p>
          )}
          {trashPhotoUrl && (
            <div className="mt-2 flex items-center gap-2">
              <img src={trashPhotoUrl} alt="Foto do lixo" className="h-12 w-12 rounded object-cover border" />
              <span className="text-xs text-muted-foreground">📷 Foto anexada</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setTrashPhotoUrl(null)}>Remover</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de Vencimento */}
      {(expiredInventory.length > 0 || visibleExpiredLabels.length > 0) && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-sm uppercase tracking-wide text-destructive">Itens Vencidos — Ação Necessária</h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {expiredInventory.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-destructive/20 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-blue-400" />
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="text-[9px]">Estoque</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{item.current_stock} {item.unit}</span>
                    <span className="text-destructive text-xs">Venceu {format(new Date(item.expiry_date! + "T12:00:00"), "dd/MM")}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={async () => {
                        if (!user) return;
                        await addEntry({
                          user_id: user.id,
                          inventory_item_id: item.id,
                          item_name: item.name,
                          quantity: item.current_stock,
                          unit: item.unit,
                          unit_cost: item.unit_cost || 0,
                          total_cost: item.current_stock * (item.unit_cost || 0),
                          reason_id: null,
                          reason_text: "Vencimento (Estoque)",
                          date: new Date().toISOString().split("T")[0],
                          notes: `Vencido em ${item.expiry_date}`,
                         });
                        setDismissedExpiredIds((prev) => new Set(prev).add(`inv-${item.id}`));
                      }}
                    >
                      Registrar
                    </Button>
                  </div>
                </div>
              ))}
              {visibleExpiredLabels.map((label) => {
                const base = prepBases.find((b) => b.name === label.name);
                return (
                  <div key={label.id} className="flex items-center justify-between rounded-md border border-destructive/20 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-medium">{label.name}</span>
                      <Badge variant="outline" className="text-[9px]">Base</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="text-destructive text-xs">Venceu {format(new Date(label.expiry_date + "T12:00:00"), "dd/MM")}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => {
                          const cost = base?.unit_cost || 0;
                          setFormPrefill({
                            sourceType: "base",
                            selectedId: base?.id ?? null,
                            itemName: label.name,
                            quantity: "1",
                            unit: base?.yield_unit || "Kg",
                            unitCost: String(cost),
                            reasonKey: "etiqueta-vencida",
                            notes: `Etiqueta vencida em ${label.expiry_date}`,
                          });
                          setShowForm(true);
                          setDismissedExpiredIds((prev) => new Set(prev).add(`label-${label.id}`));
                        }}
                      >
                        Registrar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Custo Total</p>
              <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Registros</p>
              <p className="text-xl font-bold">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-orange-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Principal Motivo</p>
              <p className="text-sm font-bold leading-tight">{topReason}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Area Chart - Trend */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tendência de Perdas (R$)
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Perda"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    fill="url(#wasteGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Donut Chart - Reasons */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Motivos de Perda
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={reasonChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {reasonChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Custo"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <Input
          placeholder="Pesquisar item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos os motivos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os motivos</SelectItem>
            {allReasonTexts.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Período */}
        <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); if (v !== "custom") setShowCustomDate(false); else setShowCustomDate(true); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="15d">Últimos 15 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {showCustomDate && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !customDateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateFrom ? format(customDateFrom, "dd/MM/yy") : "De"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateFrom}
                  onSelect={setCustomDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !customDateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateTo ? format(customDateTo, "dd/MM/yy") : "Até"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateTo}
                  onSelect={setCustomDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum desperdício registrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Custo Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => {
                  const origin = getOrigin(entry);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{getCleanName(entry.item_name)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            origin.type === "base"
                              ? "border-amber-500/30 text-amber-400 gap-1"
                              : origin.type === "lixo"
                              ? "border-green-500/30 text-green-400 gap-1"
                              : origin.type === "manual"
                              ? "border-muted-foreground/30 text-muted-foreground gap-1"
                              : "border-blue-500/30 text-blue-400 gap-1"
                          }
                        >
                          {origin.type === "base" ? (
                            <Layers className="h-3 w-3" />
                          ) : origin.type === "lixo" ? (
                            <Trash2 className="h-3 w-3" />
                          ) : (
                            <Package className="h-3 w-3" />
                          )}
                          {origin.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.quantity} {entry.unit}
                      </TableCell>
                      <TableCell>{formatCurrency(entry.unit_cost)}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(entry.total_cost)}
                      </TableCell>
                      <TableCell className="text-sm">{entry.reason_text || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showForm && user && (
        <WasteForm
          open={showForm}
          onClose={() => { setShowForm(false); setFormPrefill(null); }}
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

      {showReasons && (
        <WasteReasonsDialog
          open={showReasons}
          onClose={() => setShowReasons(false)}
          reasons={reasons}
          onAdd={addReason}
          onDelete={deleteReason}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este lançamento? Esta ação removerá o valor dos gráficos e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
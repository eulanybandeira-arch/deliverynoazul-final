import { useState, useMemo } from "react";
import { InsumoTable, Insumo } from "@/components/inventory/InsumoTable";
import { InsumoFormModal } from "@/components/inventory/InsumoFormModal";
import { ScannerModal } from "@/components/inventory/ScannerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Package, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "@/hooks/useInventory";

export default function Compras() {
  const { items, loading, addItem, updateItem, deleteItem } = useInventory();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [activeAction, setActiveAction] = useState<"scanner" | "manual">("scanner");

  const mappedInsumos: Insumo[] = useMemo(() => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category_logistics || "Outros",
      purchaseUnit: item.purchase_unit,
      stockUnit: item.stock_unit,
      yieldFactor: 100 - (item.loss || 0),
      avgCostUE: item.cost_per_stock_unit || 0,
      isActiveCMV: true
    }));
  }, [items]);

  const filteredInsumos = useMemo(() => {
    return mappedInsumos.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [mappedInsumos, search, categoryFilter]);

  const handleSaveInsumo = async (data: Partial<Insumo>) => {
    if (editingInsumo) {
      const success = await updateItem(editingInsumo.id, {
        name: data.name,
        category_logistics: data.category,
        purchase_unit: data.purchaseUnit,
        stock_unit: data.stockUnit,
        loss: 100 - (data.yieldFactor || 100)
      });
      if (success) toast.success("Insumo atualizado!");
    } else {
      const result = await addItem({
        name: data.name || "",
        purchase_unit: data.purchaseUnit || "un",
        stock_unit: data.stockUnit || "un",
        conversion_factor: 1,
        cost_per_stock_unit: data.avgCostUE || 0,
        category_logistics: data.category || "Outros",
        unit_cost: data.avgCostUE || 0,
        total_cost: data.avgCostUE || 0,
        quantity_purchased: 1,
        current_stock: 1,
        min_alert_level: 0,
        min_alert_unit: data.stockUnit || "un",
        loss: 100 - (data.yieldFactor || 100)
      });
      if (result) toast.success("Novo insumo cadastrado!");
    }
    setEditingInsumo(null);
  };

  const handleScannerSave = async (scannedItems: any[]) => {
    for (const item of scannedItems) {
      await addItem({
        name: item.name,
        purchase_unit: item.unit,
        stock_unit: item.unit,
        conversion_factor: 1,
        cost_per_stock_unit: item.price,
        category_logistics: "Secos",
        unit_cost: item.price,
        total_cost: item.price * item.quantity,
        quantity_purchased: item.quantity,
        current_stock: item.quantity,
        min_alert_level: 0,
        min_alert_unit: item.unit
      });
    }
    toast.success(`${scannedItems.length} insumos importados!`);
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setActiveAction("manual");
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteItem(id);
    if (success) toast.error("Insumo removido.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Package className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Banco de Insumos</h1>
          </div>
          <p className="text-muted-foreground">Gerencie a base do seu CMV e organize suas fichas técnicas.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            variant={activeAction === "scanner" ? "default" : "outline"}
            className={activeAction === "scanner" ? "bg-primary hover:bg-primary/90 shadow-lg gap-2" : "gap-2 border-primary text-primary hover:bg-primary/5"}
            onClick={() => {
              setActiveAction("scanner");
              setIsScannerModalOpen(true);
            }}
          >
            <Camera className="h-4 w-4" /> Scanner de Notas/Listas
          </Button>
          <Button 
            variant={activeAction === "manual" ? "default" : "outline"}
            className={activeAction === "manual" ? "bg-primary hover:bg-primary/90 shadow-lg gap-2" : "gap-2 border-primary text-primary hover:bg-primary/5"}
            onClick={() => {
              setActiveAction("manual");
              setEditingInsumo(null);
              setIsFormModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Adicionar Manualmente
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-card/40 backdrop-blur-sm p-4 rounded-2xl border border-border/40">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar insumo pelo nome..." 
            className="pl-10 bg-background/50 border-none focus-visible:ring-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-background/50 border-none">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="Carnes">Carnes</SelectItem>
              <SelectItem value="Hortifruti">Hortifruti</SelectItem>
              <SelectItem value="Laticínios">Laticínios</SelectItem>
              <SelectItem value="Secos">Secos</SelectItem>
              <SelectItem value="Embalagens">Embalagens</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <InsumoTable data={filteredInsumos} onEdit={handleEdit} onDelete={handleDelete} />

      <InsumoFormModal 
        open={isFormModalOpen} 
        onOpenChange={setIsFormModalOpen} 
        onSave={handleSaveInsumo}
        editingInsumo={editingInsumo}
      />

      <ScannerModal 
        open={isScannerModalOpen}
        onOpenChange={setIsScannerModalOpen}
        onSave={handleScannerSave}
      />
    </div>
  );
}
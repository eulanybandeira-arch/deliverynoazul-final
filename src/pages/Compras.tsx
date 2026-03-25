import { useState, useMemo } from "react";
import { InsumoTable, Insumo } from "@/components/inventory/InsumoTable";
import { InsumoFormModal } from "@/components/inventory/InsumoFormModal";
import { ScannerModal } from "@/components/inventory/ScannerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Package, Camera } from "lucide-react";
import { toast } from "sonner";

const MOCK_INSUMOS: Insumo[] = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", purchaseUnit: "Peça 1.5kg", stockUnit: "kg", yieldFactor: 85, avgCostUE: 89.90, isActiveCMV: true },
  { id: "2", name: "Tomate Italiano", category: "Hortifruti", purchaseUnit: "Caixa 20kg", stockUnit: "kg", yieldFactor: 92, avgCostUE: 6.50, isActiveCMV: true },
  { id: "3", name: "Queijo Mussarela", category: "Laticínios", purchaseUnit: "Peça 4kg", stockUnit: "kg", yieldFactor: 100, avgCostUE: 42.00, isActiveCMV: true },
  { id: "4", name: "Arroz Agulhinha T1", category: "Secos", purchaseUnit: "Fardo 30kg", stockUnit: "kg", yieldFactor: 100, avgCostUE: 5.80, isActiveCMV: true },
  { id: "5", name: "Detergente Neutro", category: "Limpeza", purchaseUnit: "Galão 5L", stockUnit: "L", yieldFactor: 100, avgCostUE: 14.50, isActiveCMV: false },
  { id: "6", name: "Embalagem Burger G", category: "Embalagens", purchaseUnit: "Cento", stockUnit: "un", yieldFactor: 100, avgCostUE: 0.85, isActiveCMV: true },
];

export default function Compras() {
  const [insumos, setInsumos] = useState(MOCK_INSUMOS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  const filteredInsumos = useMemo(() => {
    return insumos.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [insumos, search, categoryFilter]);

  const handleSaveInsumo = (data: Partial<Insumo>) => {
    if (editingInsumo) {
      setInsumos(prev => prev.map(i => i.id === editingInsumo.id ? { ...i, ...data } as Insumo : i));
      toast.success("Insumo updated successfully!");
    } else {
      const newInsumo: Insumo = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        avgCostUE: data.avgCostUE || 0,
      } as Insumo;
      setInsumos(prev => [newInsumo, ...prev]);
      toast.success("New ingredient registered!");
    }
    setEditingInsumo(null);
  };

  const handleScannerSave = (scannedItems: any[]) => {
    const newInsumos = scannedItems.map(item => ({
      id: item.id,
      name: item.name,
      category: "Secos",
      purchaseUnit: `${item.quantity}${item.unit}`,
      stockUnit: item.unit,
      yieldFactor: 100,
      avgCostUE: item.price,
      isActiveCMV: true,
    }));
    setInsumos(prev => [...newInsumos, ...prev]);
    toast.success(`${newInsumos.length} ingredients imported successfully!`);
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setInsumos(prev => prev.filter(i => i.id !== id));
    toast.error("Ingredient removed.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Package className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">
              Banco de Insumos
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie a base do seu CMV e organize suas fichas técnicas.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="bg-primary hover:bg-primary/90 shadow-lg gap-2"
            onClick={() => setIsScannerModalOpen(true)}
          >
            <Camera className="h-4 w-4" />
            Scanner de Notas/Listas
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={() => {
              setEditingInsumo(null);
              setIsFormModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar Manualmente
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

      <InsumoTable 
        data={filteredInsumos} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

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
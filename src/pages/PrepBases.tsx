import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Tag, MoreVertical, Pencil, Trash2, FileText, Package, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrepBases } from "@/hooks/usePrepBases";
import { useAuth } from "@/context/AuthContext";
import { PrepBaseForm } from "@/components/prep-bases/PrepBaseForm";
import { PrepBaseLabelDialog } from "@/components/prep-bases/PrepBaseLabelDialog";
import { PREP_BASE_CATEGORIES } from "@/types/prep-base";
import type { PrepBase } from "@/types/prep-base";

const ITEMS_PER_PAGE = 12;

export default function PrepBases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, deletePrepBase } = usePrepBases();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PrepBase | null>(null);
  const [labelItem, setLabelItem] = useState<PrepBase | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

  const paginatedItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (item: PrepBase) => {
    if (confirm(`Excluir "${item.name}"?`)) {
      await deletePrepBase(item.id);
    }
  };

  const formatCurrency = (value: number | null) =>
    value != null ? `R$${value.toFixed(2).replace(".", ",")}` : "R$0,00";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Base de Preparo</h1>
          <p className="text-sm text-muted-foreground">
            A base de preparo é a fundação do seu CMV. Calcular esse custo com exatidão garante a precisão da margem.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquise por receitas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PREP_BASE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLabelItem({} as PrepBase)}>
            <Tag className="mr-2 h-4 w-4" /> Nova Etiqueta
          </Button>
          <Button onClick={() => { setEditingItem(null); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova Receita
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : paginatedItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma receita encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/bases-preparo/${item.id}`)}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{item.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{item.category || "Sem categoria"}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/bases-preparo/${item.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo Unitário:</span>
                    <span className="font-semibold">{formatCurrency(item.unit_cost)} / {item.yield_unit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <PrepBaseForm open={showForm} onClose={() => setShowForm(false)} />}
      {labelItem && <PrepBaseLabelDialog open={!!labelItem} onClose={() => setLabelItem(null)} prepBase={labelItem.id ? labelItem : undefined} />}
    </div>
  );
}
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, FileSpreadsheet, CheckCircle2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuppliers } from "@/hooks/useSuppliers";

const MOCK_ITEMS = [
  { id: "1", name: "Picanha Argentina", category: "Carnes", supplier: "Frigorífico Boi de Ouro", unit: "kg", currentStock: 12.5, cmd: 4.2, includeLeadTime: true, finalOrder: 0 },
  { id: "2", name: "Queijo Mussarela", category: "Laticínios", supplier: "Distribuidora Silva", unit: "kg", currentStock: 8.0, cmd: 3.5, includeLeadTime: true, finalOrder: 0 },
  { id: "3", name: "Tomate Italiano", category: "Hortifruti", supplier: "Hortifruti Central", unit: "kg", currentStock: 5.0, cmd: 10.2, includeLeadTime: true, finalOrder: 0 },
];

const CATEGORIES = ["Carnes", "Hortifruti", "Laticínios", "Secos", "Embalagens", "Limpeza"];

export default function ListaCompras() {
  const { suppliers } = useSuppliers();
  const [items, setItems] = useState(MOCK_ITEMS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [globalDaysToKeep, setGlobalDaysToKeep] = useState(7);
  const [globalLeadTime, setGlobalLeadTime] = useState(2);

  // Estados dos Filtros
  const [filterType, setFilterType] = useState<"category" | "supplier">("category");
  const [filterValue, setFilterValue] = useState("all");

  const calculateSuggested = (item: any) => {
    const effectiveLeadTime = item.includeLeadTime ? globalLeadTime : 0;
    const needed = item.cmd * (globalDaysToKeep + effectiveLeadTime);
    const suggestion = needed - item.currentStock;
    return suggestion > 0 ? Math.ceil(suggestion * 10) / 10 : 0;
  };

  // Opções dinâmicas para o dropdown
  const filterOptions = useMemo(() => {
    if (filterType === "category") {
      return CATEGORIES.map(c => ({ id: c, name: c }));
    }
    return suppliers.map(s => ({ id: s.name, name: s.name }));
  }, [filterType, suppliers]);

  // Filtragem da lista
  const filteredItems = useMemo(() => {
    if (filterValue === "all") return items;
    return items.filter(item => {
      if (filterType === "category") return item.category === filterValue;
      return item.supplier === filterValue;
    });
  }, [items, filterType, filterValue]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* CABEÇALHO (PRESERVADO) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Lista de Compras Inteligente</h1>
          <p className="text-muted-foreground">Parametrize seu estoque de segurança e confirme o pedido final.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </Button>
          <Button className="gap-2 shadow-md bg-primary hover:bg-primary/90">
            <ShoppingCart className="h-4 w-4" /> Finalizar e Gerar PDF
          </Button>
        </div>
      </div>

      {/* NOVA BARRA DE FILTROS (PÍLULA + DROPDOWN) */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 backdrop-blur-sm p-3 rounded-2xl border border-border/40 w-full sm:w-fit">
        <div className="flex bg-muted/50 rounded-full p-1 border border-border/20">
          <button 
            onClick={() => { setFilterType('category'); setFilterValue('all'); }}
            className={cn(
              "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
              filterType === 'category' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Por Categoria
          </button>
          <button 
            onClick={() => { setFilterType('supplier'); setFilterValue('all'); }}
            className={cn(
              "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
              filterType === 'supplier' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Por Fornecedor
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          <Select value={filterValue} onValueChange={setFilterValue}>
            <SelectTrigger className="w-full sm:w-[240px] bg-background/50 border-none h-9 text-xs font-bold text-primary focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder={filterType === 'category' ? "Todas as Categorias" : "Todos os Fornecedores"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">
                {filterType === 'category' ? "Todas as Categorias" : "Todos os Fornecedores"}
              </SelectItem>
              {filterOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id} className="text-xs">
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CARDS DE PARÂMETROS (PRESERVADOS) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase">Dias de Cobertura Desejada</Label>
            <Input 
              type="number" 
              className="h-12 text-2xl text-center font-bold text-primary border-primary/30 bg-background/50" 
              value={globalDaysToKeep} 
              onChange={(e) => setGlobalDaysToKeep(Number(e.target.value))} 
            />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold text-primary uppercase">Prazo Médio de Entrega</Label>
            <Input 
              type="number" 
              className="h-12 text-2xl text-center font-bold text-primary border-primary/30 bg-background/50" 
              value={globalLeadTime} 
              onChange={(e) => setGlobalLeadTime(Number(e.target.value))} 
            />
          </div>
        </CardContent>
      </Card>

      {/* TABELA (PRESERVADA) */}
      <div className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[50px] px-4 text-center"></TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase">Insumo</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Estoque Atual</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center">Sugerido</TableHead>
              <TableHead className="font-bold text-primary text-xs uppercase text-center w-[160px]">Qtd. Comprar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  Nenhum item encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <TableCell className="px-4 py-4 text-center">
                    <Checkbox 
                      checked={selectedIds.has(item.id)} 
                      onCheckedChange={(checked) => {
                        const newIds = new Set(selectedIds);
                        if (checked) newIds.add(item.id);
                        else newIds.delete(item.id);
                        setSelectedIds(newIds);
                      }}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {item.category} • {item.supplier}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-sm">{item.currentStock} {item.unit}</TableCell>
                  <TableCell className="text-center">
                    {calculateSuggested(item) > 0 ? (
                      <span className="text-base font-bold text-primary">{calculateSuggested(item)}</span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex justify-center">
                      <Input type="number" placeholder="0.0" className="w-32 text-center font-bold h-10 border-primary/20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
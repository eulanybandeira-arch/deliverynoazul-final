import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreVertical, ChefHat, Sparkles, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { RecipeFormModal } from "@/components/recipes/RecipeFormModal";
import { toast } from "sonner";
import { useRecipes } from "@/hooks/useRecipes";

export default function Receitas() {
  const { recipes, loading, saveRecipe, deleteRecipe } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"manual" | "ai">("manual");
  const [editingRecipe, setEditingRecipe] = useState<any>(null);

  const mappedRecipes = useMemo(() => {
    return recipes.map(r => {
      const totalCost = r.ingredients.reduce((sum, i) => sum + i.usedValue, 0) + 
                        r.packaging.reduce((sum, p) => sum + p.usedValue, 0);
      const unitCost = r.yield > 0 ? totalCost / r.yield : 0;
      const price = (r as any).suggested_price || (unitCost * (1 + (r.profitMargin / 100)));
      const cmv = price > 0 ? (unitCost / price) * 100 : 0;

      let status = { label: "Âncora", emoji: "⚓", color: "text-slate-600", bgColor: "bg-slate-500/10" };
      if (cmv <= 30) status = { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]", bgColor: "bg-[#002B5B]/10" };

      return {
        ...r,
        unitCost,
        price,
        cmv,
        status,
        appliedPrice: String(price * 100)
      };
    });
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    return mappedRecipes.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mappedRecipes, searchTerm]);

  const bcgStats = useMemo(() => {
    return {
      tesouros: mappedRecipes.filter(r => r.status.label === "Tesouro").length,
      velas: mappedRecipes.filter(r => r.status.label === "Vela/Motor").length,
      perolas: mappedRecipes.filter(r => r.status.label === "Pérola Escondida").length,
      ancoras: mappedRecipes.filter(r => r.status.label === "Âncora").length,
    };
  }, [mappedRecipes]);

  const handleSaveRecipe = async (data: any) => {
    const recipeToSave: any = {
      id: data.id,
      name: data.name,
      yield: parseFloat(data.yieldAmount),
      profitMargin: parseFloat(data.targetCmv),
      ingredients: data.ingredients.map((i: any) => ({
        id: i.id,
        name: i.name,
        packageQty: 1,
        unit: i.unit,
        unitPrice: i.unitPrice,
        usedQty: i.quantity,
        usedUnit: i.unit,
        loss: 0,
        inventoryItemId: i.isLinked ? i.id : undefined
      })),
      packaging: data.packaging.map((p: any) => ({
        id: p.id,
        name: p.name,
        packageQty: 1,
        unit: p.unit,
        packagePrice: p.unitPrice,
        usedQty: p.quantity,
        usedUnit: p.unit,
        inventoryItemId: p.isLinked ? p.id : undefined
      })),
      appFee: 0,
      cardFee: 0,
      taxFee: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await saveRecipe(recipeToSave);
    if (result) {
      toast.success("Ficha técnica salva com sucesso!");
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Fichas Técnicas & Engenharia de Cardápio</h1>
          <p className="text-muted-foreground">Descubra os pratos que são tesouros e corte as âncoras que afundam o seu cardápio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { setEditingRecipe(null); setModalMode("ai"); setIsModalOpen(true); }} className="border-primary/20 text-primary hover:bg-primary/5 font-bold h-11 px-6">
            <Sparkles className="mr-2 h-4 w-4" /> Importar com IA
          </Button>
          <Button onClick={() => { setEditingRecipe(null); setModalMode("manual"); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 shadow-lg">
            <Plus className="mr-2 h-5 w-5" /> Nova Ficha Técnica
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">👑</div>
            <div>
              <p className="text-sm font-bold text-primary">Tesouro</p>
              <p className="text-2xl font-black text-primary">{bcgStats.tesouros}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Os queridinhos. Vendem muito e margem alta.</p>
            </div>
          </CardContent>
        </Card>
        {/* ... outros cards BCG ... */}
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between space-y-0 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Análise de Performance do Cardápio</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar prato..." className="pl-9 h-9 text-xs bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-[10px] font-bold uppercase py-4 pl-6">Prato</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-center">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Preço (R$)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id} className="hover:bg-muted/30 transition-colors border-b border-border/20 cursor-pointer group" onClick={() => { setEditingRecipe(recipe); setModalMode("manual"); setIsModalOpen(true); }}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarFallback className="bg-muted"><ChefHat className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{recipe.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><span className="text-xl" title={recipe.status.label}>{recipe.status.emoji}</span></TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{formatCurrency(recipe.price)}</TableCell>
                  <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecipeFormModal 
        key={editingRecipe?.id || modalMode}
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSave={handleSaveRecipe}
        initialData={editingRecipe}
        mode={modalMode}
      />
    </div>
  );
}
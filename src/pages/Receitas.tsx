import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Search, MoreVertical, ChefHat, Sparkles, TrendingUp, DollarSign, Target, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { RecipeFormModal } from "@/components/recipes/RecipeFormModal";
import { toast } from "sonner";

const INITIAL_RECIPES = [
  { 
    id: "1", 
    name: "Hambúrguer Clássico", 
    yieldAmount: "1", 
    yieldUnit: "Porção", 
    salesVolume: "Alta Venda", 
    photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop",
    ingredients: [], 
    packaging: [], 
    instructions: "Grelhar a carne por 3 minutes de cada lado...", 
    targetCmv: "25", 
    appliedPrice: "3500", 
    unitCost: 8.50, 
    price: 35.00, 
    cmv: 24.2, 
    status: { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]", bgColor: "bg-[#002B5B]/10" },
    isActive: true 
  },
];

export default function Receitas() {
  const [recipesList, setRecipesList] = useState(INITIAL_RECIPES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"manual" | "ai">("manual");
  const [editingRecipe, setEditingRecipe] = useState<any>(null);

  const filteredRecipes = useMemo(() => {
    return recipesList.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipesList, searchTerm]);

  // Métricas para os Cards BCG
  const bcgStats = useMemo(() => {
    return {
      tesouros: recipesList.filter(r => r.status.label === "Tesouro").length,
      velas: recipesList.filter(r => r.status.label === "Vela/Motor").length,
      perolas: recipesList.filter(r => r.status.label === "Pérola Escondida").length,
      ancoras: recipesList.filter(r => r.status.label === "Âncora").length,
    };
  }, [recipesList]);

  const handleSaveRecipe = (data: any) => {
    const exists = recipesList.find(r => r.id === data.id);
    if (exists) {
      setRecipesList(prev => prev.map(r => r.id === data.id ? data : r));
      toast.success("Ficha técnica atualizada!");
    } else {
      setRecipesList(prev => [data, ...prev]);
      toast.success("Nova ficha técnica salva!");
    }
    setIsModalOpen(false);
  };

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

      {/* MATRIZ BCG - CARDS ESTRATÉGICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#002B5B]/20 bg-[#002B5B]/5 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">👑</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#002B5B]">Tesouros</p>
              <p className="text-2xl font-black text-[#002B5B]">{bcgStats.tesouros}</p>
              <p className="text-[9px] text-muted-foreground">Alta Venda | Alto Lucro</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">⛵</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Velas/Motores</p>
              <p className="text-2xl font-black text-blue-600">{bcgStats.velas}</p>
              <p className="text-[9px] text-muted-foreground">Alta Venda | Baixo Lucro</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">🦪</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Pérolas</p>
              <p className="text-2xl font-black text-emerald-600">{bcgStats.perolas}</p>
              <p className="text-[9px] text-muted-foreground">Baixa Venda | Alto Lucro</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-3xl">⚓</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Âncoras</p>
              <p className="text-2xl font-black text-slate-600">{bcgStats.ancoras}</p>
              <p className="text-[9px] text-muted-foreground">Baixa Venda | Baixo Lucro</p>
            </div>
          </CardContent>
        </Card>
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
                        <AvatarImage src={recipe.photoUrl} />
                        <AvatarFallback className="bg-muted"><ChefHat className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{recipe.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><span className="text-xl" title={recipe.status.label}>{recipe.status.emoji}</span></TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold">{formatCurrency(parseFloat(recipe.appliedPrice || "0") / 100)}</TableCell>
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
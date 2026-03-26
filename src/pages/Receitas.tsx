import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, Search, MoreVertical, Printer, ChefHat, Wand2 } from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { RecipeFormModal } from "@/components/recipes/RecipeFormModal";
import { AIImportModal } from "@/components/recipes/AIImportModal";
import { toast } from "sonner";

// Dados iniciais para teste
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
    status: { label: "Tesouro", emoji: "👑", color: "bg-primary/10 text-primary border-primary/20" },
    isActive: true 
  },
  { 
    id: "2", 
    name: "Batata Frita G", 
    yieldAmount: "1", 
    yieldUnit: "Porção", 
    salesVolume: "Alta Venda", 
    photoUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100&h=100&fit=crop",
    ingredients: [], 
    packaging: [], 
    instructions: "Fritar a 180 graus até dourar.", 
    targetCmv: "30", 
    appliedPrice: "1800", 
    unitCost: 6.20, 
    price: 18.00, 
    cmv: 34.4, 
    status: { label: "Vela/Motor", emoji: "⛵", color: "bg-blue-400/10 text-blue-600 border-blue-200" },
    isActive: true 
  },
];

export default function Receitas() {
  const navigate = useNavigate();
  const [recipesList, setRecipesList] = useState(INITIAL_RECIPES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);

  const filteredRecipes = useMemo(() => {
    return recipesList.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipesList, searchTerm]);

  const stats = useMemo(() => {
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
    setEditingRecipe(null);
  };

  const handleAiProcessComplete = (data: any) => {
    // 1. Primeiro definimos os dados
    setEditingRecipe(data);
    // 2. Fechamos o modal de IA
    setIsAiModalOpen(false);
    // 3. Abrimos o formulário principal com um delay seguro para o Radix UI
    setTimeout(() => {
      setIsModalOpen(true);
      toast.success("Receita extraída! Revise os processos.");
    }, 200);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ficha técnica?")) {
      setRecipesList(prev => prev.filter(r => r.id !== id));
      toast.error("Ficha técnica removida.");
    }
  };

  const toggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecipesList(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const openEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Fichas Técnicas & Engenharia de Cardápio</h1>
          <p className="text-muted-foreground">Descubra os pratos que são tesouros e corte as âncoras que afundam o seu cardápio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsAiModalOpen(true)}
            className="border-primary/20 text-primary hover:bg-primary/5 font-bold h-11 px-6 transition-all"
          >
            <span className="mr-2">🪄</span> Importar Ficha Técnica com IA
          </Button>
          <Button 
            onClick={() => { setEditingRecipe(null); setIsModalOpen(true); }} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 transition-all shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" /> Nova Ficha Técnica
          </Button>
        </div>
      </div>

      {/* Painel de Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👑</span>
              <Badge variant="outline" className="bg-primary text-primary-foreground border-none">{stats.tesouros}</Badge>
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2 text-primary">Tesouro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Alta Venda | Alto Lucro.</span> O grande prêmio do restaurante. Foque em vender mais.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⛵</span>
              <Badge variant="outline" className="bg-blue-500 text-white border-none">{stats.velas}</Badge>
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">Vela/Motor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Alta Venda | Baixo Lucro.</span> Dá tração e traz clientes. Otimize os custos.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🦪</span>
              <Badge variant="outline" className="bg-emerald-600 text-white border-none">{stats.perolas}</Badge>
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">Pérola Escondida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Baixa Venda | Alto Lucro.</span> Vale muito quando sai. Aumente a divulgação.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚓</span>
              <Badge variant="outline" className="bg-slate-600 text-white border-none">{stats.ancoras}</Badge>
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">Âncora</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Baixa Venda | Baixo Lucro.</span> Peso morto que afunda o lucro. Remova ou reformule.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cardápio */}
      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between space-y-0 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Análise de Performance do Cardápio</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar prato..." 
              className="pl-9 h-9 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-[10px] font-bold uppercase py-4 pl-6">Prato</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-center">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-center">Ativo</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Preço (R$)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">CMV (%)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                    Nenhuma ficha técnica encontrada. Comece criando uma nova.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecipes.map((recipe) => (
                  <TableRow 
                    key={recipe.id} 
                    className={cn(
                      "hover:bg-muted/30 transition-colors border-b border-border/20 cursor-pointer group",
                      !recipe.isActive && "opacity-60"
                    )}
                    onClick={() => openEdit(recipe)}
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/50">
                          <AvatarImage src={recipe.photoUrl} />
                          <AvatarFallback className="bg-muted"><ChefHat className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{recipe.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xl" title={recipe.status.label}>{recipe.status.emoji}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch 
                          checked={recipe.isActive} 
                          onCheckedChange={() => toggleActive(recipe.id, { stopPropagation: () => {} } as any)} 
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{recipe.isActive ? "Sim" : "Não"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatCurrency(parseFloat(recipe.appliedPrice || "0") / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        recipe.cmv > 35 ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50"
                      )}>
                        {recipe.cmv.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast.info("Impressão de custo em desenvolvimento.")}>
                              <Printer className="mr-2 h-4 w-4" /> Imprimir Custo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(recipe)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(recipe.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecipeFormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSave={handleSaveRecipe}
        initialData={editingRecipe}
      />

      <AIImportModal 
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onProcessComplete={handleAiProcessComplete}
      />
    </div>
  );
}
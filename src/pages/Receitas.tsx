import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { formatCurrency } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { RecipeWizardModal } from "@/components/recipes/RecipeWizardModal";
import { toast } from "sonner";

export default function Receitas() {
  const navigate = useNavigate();
  const { recipes, loading, deleteRecipe, saveRecipe } = useRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Lógica de Engenharia de Cardápio (Matriz de Boston adaptada para Gastronomia)
  const analyzedRecipes = useMemo(() => {
    return recipes.map(recipe => {
      const totalCost = recipe.ingredients.reduce((sum, ing) => sum + ing.usedValue, 0) + 
                        recipe.packaging.reduce((sum, pkg) => sum + pkg.usedValue, 0);
      const unitCost = recipe.yield > 0 ? totalCost / recipe.yield : 0;
      const price = recipe.suggested_price || (unitCost * (1 + (recipe.profitMargin / 100)));
      const cmv = price > 0 ? (unitCost / price) * 100 : 0;
      
      // Mock de popularidade (em um cenário real viria do volume de vendas)
      const mockPopularity = (parseInt(recipe.id.slice(-1)) || 5) > 5 ? "Alta Venda" : "Baixa Venda";
      const profitStatus = cmv <= 30 ? "Alto" : "Baixo";

      let status = { label: "Âncora", emoji: "⚓", color: "bg-slate-500/10 text-slate-600 border-slate-200" };
      
      if (mockPopularity === "Alta Venda" && profitStatus === "Alto") {
        status = { label: "Tesouro", emoji: "👑", color: "bg-[#002B5B]/10 text-[#002B5B] border-[#002B5B]/20" };
      } else if (mockPopularity === "Alta Venda" && profitStatus === "Baixo") {
        status = { label: "Vela/Motor", emoji: "⛵", color: "bg-blue-400/10 text-blue-600 border-blue-200" };
      } else if (mockPopularity === "Baixa Venda" && profitStatus === "Alto") {
        status = { label: "Pérola Escondida", emoji: "🦪", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
      }

      return { ...recipe, unitCost, price, cmv, status };
    });
  }, [recipes]);

  const filteredRecipes = analyzedRecipes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    return {
      tesouros: analyzedRecipes.filter(r => r.status.label === "Tesouro").length,
      velas: analyzedRecipes.filter(r => r.status.label === "Vela/Motor").length,
      perolas: analyzedRecipes.filter(r => r.status.label === "Pérola Escondida").length,
      ancoras: analyzedRecipes.filter(r => r.status.label === "Âncora").length,
    };
  }, [analyzedRecipes]);

  const handleSaveNewRecipe = async (data: any) => {
    try {
      const recipeToSave = {
        name: data.name,
        yield: data.yield,
        profitMargin: ((data.price - data.unitCost) / data.unitCost) * 100,
        ingredients: data.ingredients.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          packageQty: 1, // Simplificado para o wizard
          unit: ing.unit,
          unitPrice: ing.cost / ing.quantity,
          usedQty: ing.quantity,
          usedValue: ing.cost,
          inventoryItemId: ing.inventoryItemId
        })),
        packaging: [],
        appFee: 0,
        cardFee: 0,
        taxFee: 0,
        status: 'published'
      };

      await saveRecipe(recipeToSave as any);
      toast.success("Ficha técnica salva com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar ficha técnica.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando engenharia de cardápio...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      {/* Header Estratégico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fichas Técnicas & Engenharia</h1>
          <p className="text-muted-foreground">Descubra os pratos que são tesouros e corte as âncoras que afundam o seu cardápio.</p>
        </div>
        <Button 
          onClick={() => setIsWizardOpen(true)} 
          className="bg-[#002B5B] hover:bg-[#001f3f] text-white font-bold h-11 px-6 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus className="mr-2 h-5 w-5" /> Nova Ficha Técnica
        </Button>
      </div>

      {/* Painel de Diagnóstico (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👑</span>
              <Badge variant="outline" className="bg-[#002B5B] text-white border-none">{stats.tesouros}</Badge>
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider mt-2">Tesouro</CardTitle>
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
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Análise de Performance do Cardápio</CardTitle>
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
                <TableHead className="text-[10px] font-bold uppercase text-right">Preço de Venda (R$)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">Custo Unitário (R$)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-right">CMV (%)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-center">Status Estratégico</TableHead>
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
                  <TableRow key={recipe.id} className="hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="py-4 pl-6 font-semibold text-sm">{recipe.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(recipe.price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(recipe.unitCost)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded",
                        recipe.cmv > 35 ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50"
                      )}>
                        {recipe.cmv.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[10px] font-bold uppercase tracking-tighter py-1 px-2", recipe.status.color)}>
                        {recipe.status.emoji} {recipe.status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-[#002B5B]"
                          onClick={() => navigate(`/receitas/${recipe.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => {
                            if(confirm("Excluir esta ficha técnica?")) deleteRecipe(recipe.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecipeWizardModal 
        open={isWizardOpen} 
        onOpenChange={setIsWizardOpen}
        onSave={handleSaveNewRecipe}
      />
    </div>
  );
}
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Settings2, 
  TrendingDown, 
  Smartphone,
  UtensilsCrossed,
  Zap,
  Bike,
  FileDown,
  LayoutGrid,
  ChefHat,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/pricing";
import { toast } from "sonner";

interface ChannelFees {
  id: string;
  name: string;
  icon: any;
  type: 'standard' | 'salao' | 'delivery-proprio';
  baseCommission?: number;
  transactionFee: number;
  campaigns?: number;
  monthlyFee?: number;
  discounts?: number;
  motoboyCost?: number;
  deliveryFeeCharged?: number;
}

const INITIAL_CHANNELS: ChannelFees[] = [
  { id: "ifood-entrega", name: "iFood (Plano Entrega)", type: 'standard', icon: Smartphone, baseCommission: 23, transactionFee: 3.2, campaigns: 5, monthlyFee: 150 },
  { id: "ifood-basico", name: "iFood (Plano Básico)", type: 'standard', icon: Smartphone, baseCommission: 12, transactionFee: 3.2, campaigns: 5, monthlyFee: 110 },
  { id: "99food-flex", name: "99Food (Plano Flex)", type: 'standard', icon: Smartphone, baseCommission: 8.9, transactionFee: 3.2, campaigns: 0, monthlyFee: 0 },
  { id: "99food-fixo", name: "99Food (Plano Fixo)", type: 'standard', icon: Smartphone, baseCommission: 0, transactionFee: 3.2, campaigns: 0, monthlyFee: 0 },
  { id: "rappi", name: "Rappi", type: 'standard', icon: Smartphone, baseCommission: 27, transactionFee: 3.5, campaigns: 5, monthlyFee: 0 },
  { id: "aiqfome", name: "Aiqfome", type: 'standard', icon: Smartphone, baseCommission: 12, transactionFee: 2.99, campaigns: 0, monthlyFee: 0 },
  { id: "salao", name: "Salão / Balcão", type: 'salao', icon: UtensilsCrossed, transactionFee: 2, discounts: 0 },
  { id: "delivery-proprio", name: "Delivery Próprio", type: 'delivery-proprio', icon: Bike, transactionFee: 1, motoboyCost: 10, deliveryFeeCharged: 7 },
];

const MOCK_RECIPES = [
  { id: "r1", name: "Hambúrguer Blend Especial", price: 45.00, cost: 12.50 },
  { id: "r2", name: "Combo X-Burger + Batata", price: 35.00, cost: 11.80 },
  { id: "r3", name: "Hot Dog Gourmet", price: 22.00, cost: 9.50 },
];

export default function Marketplaces() {
  const [channels, setChannels] = useState<ChannelFees[]>(INITIAL_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState("ifood-entrega");
  const [selectedRecipeId, setSelectedRecipeId] = useState("r1");
  const [viewMode, setViewMode] = useState<"channel" | "recipe">("channel");
  const [openChannelId, setOpenChannelId] = useState<string | null>(null);

  const handleUpdateFee = (channelId: string, field: keyof ChannelFees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, [field]: numValue } : c));
  };

  const calculateErosion = (recipe: any, channel: ChannelFees) => {
    let erosionValue = 0;
    let feeLabel = "";

    if (channel.type === 'salao') {
      const totalPercent = channel.transactionFee + (channel.discounts || 0);
      erosionValue = recipe.price * (totalPercent / 100);
      feeLabel = `${totalPercent.toFixed(1)}% (Maquininha + Desc.)`;
    } 
    else if (channel.type === 'delivery-proprio') {
      const gatewayErosion = recipe.price * (channel.transactionFee / 100);
      const logisticsSubsidy = Math.max(0, (channel.motoboyCost || 0) - (channel.deliveryFeeCharged || 0));
      erosionValue = gatewayErosion + logisticsSubsidy;
      feeLabel = `${channel.transactionFee}% Gateway + ${formatCurrency(logisticsSubsidy)} Subsídio Frete`;
    } 
    else {
      const totalPercent = (channel.baseCommission || 0) + channel.transactionFee + (channel.campaigns || 0);
      erosionValue = recipe.price * (totalPercent / 100);
      feeLabel = `${totalPercent.toFixed(1)}% em taxas`;
    }

    const contributionValue = recipe.price - recipe.cost - erosionValue;
    const contributionPercent = (contributionValue / recipe.price) * 100;

    let bcg = { label: "Âncora", emoji: "⚓", color: "text-slate-500", bgColor: "bg-slate-500/10" };
    if (contributionPercent > 35) bcg = { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]", bgColor: "bg-[#002B5B]/10" };
    else if (contributionPercent >= 15) bcg = { label: "Vela", emoji: "⛵", color: "text-blue-500", bgColor: "bg-blue-500/10" };

    return { erosionValue, contributionValue, contributionPercent, bcg, feeLabel };
  };

  const channelAnalysisData = useMemo(() => {
    const channel = channels.find(c => c.id === selectedChannelId) || channels[0];
    return MOCK_RECIPES.map(recipe => ({
      ...recipe,
      ...calculateErosion(recipe, channel)
    }));
  }, [channels, selectedChannelId]);

  const recipeAnalysisData = useMemo(() => {
    const recipe = MOCK_RECIPES.find(r => r.id === selectedRecipeId) || MOCK_RECIPES[0];
    return channels.map(channel => ({
      channelName: channel.name,
      channelIcon: channel.icon,
      price: recipe.price,
      cost: recipe.cost,
      ...calculateErosion(recipe, channel)
    }));
  }, [channels, selectedRecipeId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">Marketplaces & Canais</h1>
        <p className="text-muted-foreground">Configure as taxas das plataformas e descubra a erosão real do seu lucro.</p>
      </header>

      {/* SEÇÃO 1: SETUP DE TAXAS - GRID COMPACTO COM ACCORDIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {channels.map((channel) => (
          <Collapsible
            key={channel.id}
            open={openChannelId === channel.id}
            onOpenChange={(isOpen) => setOpenChannelId(isOpen ? channel.id : null)}
            className="w-full"
          >
            <Card className={cn(
              "border-border/40 bg-white dark:bg-card/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
              openChannelId === channel.id && "ring-1 ring-primary/20 shadow-lg"
            )}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <channel.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold truncate text-foreground">{channel.name}</span>
                  </div>
                  {openChannelId === channel.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="animate-accordion-down">
                <CardContent className="pt-4 pb-4 px-4 space-y-4 border-t border-border/20">
                  <div className="space-y-3">
                    {channel.type === 'salao' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Maquininha</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.transactionFee} 
                              onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descontos</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.discounts} 
                              onChange={(e) => handleUpdateFee(channel.id, 'discounts', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                      </>
                    ) : channel.type === 'delivery-proprio' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Gateway/Pix</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.transactionFee} 
                              onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custo Motoboy</Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                            <Input 
                              type="number" 
                              value={channel.motoboyCost} 
                              onChange={(e) => handleUpdateFee(channel.id, 'motoboyCost', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Entrega</Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                            <Input 
                              type="number" 
                              value={channel.deliveryFeeCharged} 
                              onChange={(e) => handleUpdateFee(channel.id, 'deliveryFeeCharged', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comissão</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.baseCommission} 
                              onChange={(e) => handleUpdateFee(channel.id, 'baseCommission', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transação</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.transactionFee} 
                              onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campanhas</Label>
                          <div className="flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              value={channel.campaigns} 
                              onChange={(e) => handleUpdateFee(channel.id, 'campaigns', e.target.value)}
                              className="h-7 w-14 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                            <span className="text-[10px] font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mensalidade</Label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                            <Input 
                              type="number" 
                              value={channel.monthlyFee} 
                              onChange={(e) => handleUpdateFee(channel.id, 'monthlyFee', e.target.value)}
                              className="h-7 w-16 text-right font-bold text-[11px] bg-slate-50/50 dark:bg-background/50 border-border/50"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => { setOpenChannelId(null); toast.success("Configurações salvas!"); }}>
                    <Settings2 className="h-3 w-3 mr-1.5" /> Salvar
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* SEÇÃO 2: ANÁLISE DE EROSÃO - AGORA MAIS VISÍVEL */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shadow-sm">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Análise de Erosão por Canal</h2>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 font-bold text-xs uppercase tracking-wider border-border/60"
            onClick={() => toast.success("Relatório PDF gerado com sucesso!")}
          >
            <FileDown className="h-4 w-4" /> Exportar Relatório (PDF)
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-card/40 backdrop-blur-sm p-3 rounded-2xl border border-border/40 shadow-sm">
          <Tabs 
            value={viewMode} 
            onValueChange={(v: any) => setViewMode(v)} 
            className="w-full lg:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-muted/50">
              <TabsTrigger value="channel" className="gap-2 text-xs font-bold uppercase tracking-tighter">
                <LayoutGrid className="h-3.5 w-3.5" /> Visão por Canal
              </TabsTrigger>
              <TabsTrigger value="recipe" className="gap-2 text-xs font-bold uppercase tracking-tighter">
                <ChefHat className="h-3.5 w-3.5" /> Visão por Prato
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 whitespace-nowrap">
              {viewMode === "channel" ? "Analisar cenário no canal:" : "Selecione a Receita:"}
            </span>
            <Select 
              value={viewMode === "channel" ? selectedChannelId : selectedRecipeId} 
              onValueChange={viewMode === "channel" ? setSelectedChannelId : setSelectedRecipeId}
            >
              <SelectTrigger className="w-full lg:w-[280px] h-9 border-none bg-slate-50/50 dark:bg-transparent focus:ring-0 font-bold text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewMode === "channel" ? (
                  channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                ) : (
                  MOCK_RECIPES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-border/40 bg-white dark:bg-card shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase py-5 pl-6 text-muted-foreground">
                    {viewMode === "channel" ? "Prato" : "Canal de Venda"}
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-muted-foreground">Preço de Venda</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-muted-foreground">Custo (CMV)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-destructive">Erosão do Canal</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-green-600">Margem de Contribuição</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center pr-6 text-muted-foreground">Status BCG Dinâmico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(viewMode === "channel" ? channelAnalysisData : recipeAnalysisData).map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="py-5 pl-6 font-bold text-sm text-foreground">
                      {viewMode === "channel" ? (
                        item.name
                      ) : (
                        <div className="flex items-center gap-2">
                          <item.channelIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.channelName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(item.cost)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-destructive text-sm">-{formatCurrency(item.erosionValue)}</span>
                        <span className="text-[10px] text-destructive/70 font-bold uppercase tracking-tighter">
                          {item.feeLabel}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600 text-sm">{formatCurrency(item.contributionValue)}</span>
                        <span className="text-[10px] text-green-600/70 font-bold uppercase tracking-tighter">{item.contributionPercent.toFixed(1)}% real</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge className={cn("gap-1.5 py-1.5 px-3 border-none shadow-sm", item.bcg.bgColor, item.bcg.color)}>
                        <span className="text-lg leading-none">{item.bcg.emoji}</span>
                        <span className="font-black uppercase tracking-tighter text-[10px]">{item.bcg.label}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 p-5 bg-primary/5 border border-primary/10 rounded-2xl shadow-inner">
          <div className="p-2 rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-primary uppercase tracking-wider">Dica de Engenharia:</span> 
            {viewMode === "recipe" ? (
              " Compare as margens entre os canais. Se um prato é 'Tesouro' no Salão mas 'Âncora' no iFood, você precisa ajustar o preço dinâmico ou criar uma oferta exclusiva para proteger seu lucro."
            ) : (
              " Se um prato virou Âncora neste canal, considere aumentar o preço apenas nesta plataforma ou criar um combo exclusivo para diluir a erosão das taxas."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
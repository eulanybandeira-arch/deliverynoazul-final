import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  Settings2, 
  TrendingDown, 
  AlertCircle, 
  ChevronRight, 
  Info,
  Smartphone,
  MessageSquare,
  UtensilsCrossed,
  Zap,
  Bike
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/pricing";

interface ChannelFees {
  id: string;
  name: string;
  icon: any;
  baseCommission?: number;
  transactionFee: number;
  campaigns?: number;
  monthlyFee?: number;
  discounts?: number; // Para Salão
  motoboyCost?: number; // Para Delivery Próprio
  deliveryFeeCharged?: number; // Para Delivery Próprio
}

const INITIAL_CHANNELS: ChannelFees[] = [
  { id: "ifood-entrega", name: "iFood (Plano Entrega)", icon: Smartphone, baseCommission: 23, transactionFee: 3.2, campaigns: 5, monthlyFee: 150 },
  { id: "ifood-basico", name: "iFood (Plano Básico)", icon: Smartphone, baseCommission: 12, transactionFee: 3.2, campaigns: 5, monthlyFee: 110 },
  { id: "99food", name: "99Food", icon: Smartphone, baseCommission: 25, transactionFee: 3.2, campaigns: 0, monthlyFee: 0 },
  { id: "aiqfome", name: "Aiqfome", icon: Smartphone, baseCommission: 12, transactionFee: 3.5, campaigns: 0, monthlyFee: 0 },
  { id: "rappi", name: "Rappi", icon: Smartphone, baseCommission: 15, transactionFee: 3.5, campaigns: 5, monthlyFee: 0 },
  { id: "salao", name: "Salão / Balcão", icon: UtensilsCrossed, transactionFee: 2, discounts: 0 },
  { id: "delivery-proprio", name: "Delivery Próprio", icon: Bike, transactionFee: 2, motoboyCost: 10, deliveryFeeCharged: 7, campaigns: 0 },
];

const MOCK_RECIPES = [
  { id: "r1", name: "Hambúrguer Blend Especial", price: 45.00, cost: 12.50 },
  { id: "r2", name: "Combo X-Burger + Batata", price: 35.00, cost: 11.80 },
  { id: "r3", name: "Hot Dog Gourmet", price: 22.00, cost: 9.50 },
];

export default function Marketplaces() {
  const [channels, setChannels] = useState<ChannelFees[]>(INITIAL_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState("ifood-entrega");

  const handleUpdateFee = (channelId: string, field: keyof ChannelFees, value: string) => {
    const numValue = parseFloat(value) || 0;
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, [field]: numValue } : c));
  };

  const selectedChannel = useMemo(() => 
    channels.find(c => c.id === selectedChannelId) || channels[0], 
  [channels, selectedChannelId]);

  const analysisData = useMemo(() => {
    return MOCK_RECIPES.map(recipe => {
      let totalFeePercent = 0;
      let fixedErosion = 0;

      if (selectedChannel.id === 'delivery-proprio') {
        totalFeePercent = selectedChannel.transactionFee + (selectedChannel.campaigns || 0);
        // Subsídio logístico: Custo Motoboy - Taxa Cobrada
        const freightSubsidy = Math.max(0, (selectedChannel.motoboyCost || 0) - (selectedChannel.deliveryFeeCharged || 0));
        fixedErosion = freightSubsidy;
      } else if (selectedChannel.id === 'salao') {
        totalFeePercent = selectedChannel.transactionFee + (selectedChannel.discounts || 0);
      } else {
        totalFeePercent = (selectedChannel.baseCommission || 0) + selectedChannel.transactionFee + (selectedChannel.campaigns || 0);
      }

      const erosionValue = (recipe.price * (totalFeePercent / 100)) + fixedErosion;
      const contributionValue = recipe.price - recipe.cost - erosionValue;
      const contributionPercent = (contributionValue / recipe.price) * 100;

      let bcg = { label: "Âncora", emoji: "⚓", color: "text-slate-500", bgColor: "bg-slate-500/10" };
      if (contributionPercent > 35) bcg = { label: "Tesouro", emoji: "👑", color: "text-[#002B5B]", bgColor: "bg-[#002B5B]/10" };
      else if (contributionPercent >= 15) bcg = { label: "Vela", emoji: "⛵", color: "text-blue-500", bgColor: "bg-blue-500/10" };

      return {
        ...recipe,
        erosionValue,
        contributionValue,
        contributionPercent,
        bcg,
        totalFeePercent,
        fixedErosion
      };
    });
  }, [selectedChannel]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">Marketplaces & Canais</h1>
        <p className="text-muted-foreground">Configure as taxas das plataformas e descubra a erosão real do seu lucro.</p>
      </header>

      {/* SEÇÃO 1: SETUP DE TAXAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {channels.map((channel) => (
          <Card key={channel.id} className="border-border/40 bg-white dark:bg-card/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <CardHeader className="pb-4 border-b border-border/20 bg-slate-50/50 dark:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                  <channel.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold truncate text-foreground">{channel.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-4">
                {/* Campos Dinâmicos por Canal */}
                {channel.id === 'salao' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Maquininha</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.transactionFee} 
                          onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descontos/Fidelidade</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.discounts} 
                          onChange={(e) => handleUpdateFee(channel.id, 'discounts', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </>
                ) : channel.id === 'delivery-proprio' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Gateway/Pagto</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.transactionFee} 
                          onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
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
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Taxa Entrega Cobrada</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                        <Input 
                          type="number" 
                          value={channel.deliveryFeeCharged} 
                          onChange={(e) => handleUpdateFee(channel.id, 'deliveryFeeCharged', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campanhas/Cupons</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.campaigns} 
                          onChange={(e) => handleUpdateFee(channel.id, 'campaigns', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comissão Base</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.baseCommission} 
                          onChange={(e) => handleUpdateFee(channel.id, 'baseCommission', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Transação/Maquininha</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.transactionFee} 
                          onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campanhas/Cupons</Label>
                      <div className="flex items-center gap-1.5">
                        <Input 
                          type="number" 
                          value={channel.campaigns} 
                          onChange={(e) => handleUpdateFee(channel.id, 'campaigns', e.target.value)}
                          className="h-8 w-16 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/20">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mensalidade Fixa</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                        <Input 
                          type="number" 
                          value={channel.monthlyFee} 
                          onChange={(e) => handleUpdateFee(channel.id, 'monthlyFee', e.target.value)}
                          className="h-8 w-20 text-right font-bold text-xs bg-slate-50/50 dark:bg-background/50 border-border/50"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 dark:bg-muted/10 py-3">
              <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                <Settings2 className="h-3 w-3 mr-2" /> Configurar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* SEÇÃO 2: ANÁLISE DE EROSÃO */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shadow-sm">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Análise de Erosão por Canal</h2>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-card/40 backdrop-blur-sm p-2 rounded-2xl border border-border/40 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3">Analisar cenário no canal:</span>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger className="w-[240px] h-9 border-none bg-slate-50/50 dark:bg-transparent focus:ring-0 font-bold text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-border/40 bg-white dark:bg-card shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase py-5 pl-6 text-muted-foreground">Prato</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-muted-foreground">Preço de Venda</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-muted-foreground">Custo (CMV)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-destructive">Erosão do Canal</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-green-600">Margem de Contribuição</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center pr-6 text-muted-foreground">Status BCG Dinâmico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="py-5 pl-6 font-bold text-sm text-foreground">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(item.cost)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-destructive text-sm">-{formatCurrency(item.erosionValue)}</span>
                        <span className="text-[10px] text-destructive/70 font-bold uppercase tracking-tighter">
                          {selectedChannel.id === 'delivery-proprio' ? (
                            <>
                              {item.totalFeePercent.toFixed(1)}% taxas + {formatCurrency(item.fixedErosion)} frete
                            </>
                          ) : (
                            <>{item.totalFeePercent.toFixed(1)}% em taxas</>
                          )}
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
            {selectedChannel.id === 'delivery-proprio' ? (
              " No Delivery Próprio, a erosão oculta está no frete. Se o custo do motoboy é maior que a taxa cobrada, você está subsidiando a entrega com sua margem de lucro."
            ) : (
              " Se um prato virou Âncora neste canal, considere aumentar o preço apenas nesta plataforma ou criar um combo exclusivo para diluir a erosão das taxas."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
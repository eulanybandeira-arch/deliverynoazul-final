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
  UtensilsCrossed
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/pricing";

interface ChannelFees {
  id: string;
  name: string;
  icon: any;
  baseCommission: number;
  transactionFee: number;
  campaigns: number;
  monthlyFee: number;
}

const INITIAL_CHANNELS: ChannelFees[] = [
  { id: "ifood-entrega", name: "iFood (Plano Entrega)", icon: Smartphone, baseCommission: 23, transactionFee: 3.2, campaigns: 5, monthlyFee: 150 },
  { id: "ifood-basico", name: "iFood (Plano Básico)", icon: Smartphone, baseCommission: 12, transactionFee: 3.2, campaigns: 5, monthlyFee: 110 },
  { id: "rappi", name: "Rappi", icon: Smartphone, baseCommission: 15, transactionFee: 3.5, campaigns: 5, monthlyFee: 0 },
  { id: "proprio", name: "Salão / WhatsApp / Próprio", icon: UtensilsCrossed, baseCommission: 0, transactionFee: 2, campaigns: 0, monthlyFee: 0 },
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
      const totalFeePercent = selectedChannel.baseCommission + selectedChannel.transactionFee + selectedChannel.campaigns;
      const erosionValue = recipe.price * (totalFeePercent / 100);
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
        bcg
      };
    });
  }, [selectedChannel]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Marketplaces & Canais</h1>
        <p className="text-muted-foreground">Configure as taxas das plataformas e descubra a erosão real do seu lucro.</p>
      </header>

      {/* SEÇÃO 1: SETUP DE TAXAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {channels.map((channel) => (
          <Card key={channel.id} className="border-border/40 bg-card/40 backdrop-blur-sm shadow-lg overflow-hidden group">
            <CardHeader className="pb-4 border-b border-border/20 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <channel.icon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold truncate">{channel.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Comissão Base</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={channel.baseCommission} 
                      onChange={(e) => handleUpdateFee(channel.id, 'baseCommission', e.target.value)}
                      className="h-7 w-16 text-right font-bold text-xs bg-background/50 border-none focus-visible:ring-1"
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Transação/Maquininha</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={channel.transactionFee} 
                      onChange={(e) => handleUpdateFee(channel.id, 'transactionFee', e.target.value)}
                      className="h-7 w-16 text-right font-bold text-xs bg-background/50 border-none focus-visible:ring-1"
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Campanhas/Cupons</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={channel.campaigns} 
                      onChange={(e) => handleUpdateFee(channel.id, 'campaigns', e.target.value)}
                      className="h-7 w-16 text-right font-bold text-xs bg-background/50 border-none focus-visible:ring-1"
                    />
                    <span className="text-xs font-bold text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/20">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Mensalidade Fixa</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                    <Input 
                      type="number" 
                      value={channel.monthlyFee} 
                      onChange={(e) => handleUpdateFee(channel.id, 'monthlyFee', e.target.value)}
                      className="h-7 w-20 text-right font-bold text-xs bg-background/50 border-none focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 py-3">
              <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">
                <Settings2 className="h-3 w-3 mr-2" /> Editar Taxas
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* SEÇÃO 2: ANÁLISE DE EROSÃO */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Análise de Erosão por Canal</h2>
          </div>

          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-sm p-1.5 rounded-xl border border-border/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3">Analisar cenário no canal:</span>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger className="w-[240px] h-9 border-none bg-transparent focus:ring-0 font-bold text-primary">
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

        <Card className="border-border/40 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase py-4 pl-6">Prato</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Preço de Venda</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Custo (CMV)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-destructive">Erosão do Canal</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-green-600">Margem de Contribuição</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center pr-6">Status BCG Dinâmico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="py-4 pl-6 font-bold text-sm">{item.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(item.cost)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-destructive text-sm">-{formatCurrency(item.erosionValue)}</span>
                        <span className="text-[10px] text-destructive/70 font-bold">
                          {(selectedChannel.baseCommission + selectedChannel.transactionFee + selectedChannel.campaigns).toFixed(1)}% em taxas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600 text-sm">{formatCurrency(item.contributionValue)}</span>
                        <span className="text-[10px] text-green-600/70 font-bold">{item.contributionPercent.toFixed(1)}% real</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge className={cn("gap-1.5 py-1 px-3 border-none", item.bcg.bgColor, item.bcg.color)}>
                        <span className="text-lg">{item.bcg.emoji}</span>
                        <span className="font-black uppercase tracking-tighter text-[10px]">{item.bcg.label}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-primary">Dica de Engenharia:</span> Se um prato virou <span className="font-bold text-slate-500">⚓ Âncora</span> neste canal, considere aumentar o preço apenas nesta plataforma ou criar um combo exclusivo para diluir a erosão das taxas.
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Store, TrendingUp, TrendingDown, AlertCircle, Settings } from "lucide-react";
import { SalesChannel } from "@/types/pricing";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { formatCurrency } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Ícones dos canais como componentes SVG
const IFoodIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.4c5.302 0 9.6 4.298 9.6 9.6s-4.298 9.6-9.6 9.6-9.6-4.298-9.6-9.6 4.298-9.6 9.6-9.6z" fill="#EA1D2C"/>
    <circle cx="12" cy="12" r="6" fill="#EA1D2C"/>
  </svg>
);

const RappiIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <circle cx="12" cy="12" r="12" fill="#FF441F"/>
    <path d="M7 8h3v8H7V8zm4 0h3c2 0 3.5 1.5 3.5 4s-1.5 4-3.5 4h-3V8zm3 6c1 0 1.5-.5 1.5-2s-.5-2-1.5-2h-1v4h1z" fill="white"/>
  </svg>
);

const Food99Icon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <rect width="24" height="24" rx="4" fill="#FFCC00"/>
    <path d="M5 8c0-1.5 1-2.5 2.5-2.5S10 6.5 10 8c0 2-2.5 2.5-2.5 5h-2c0-3 2.5-3.5 2.5-5 0-.5-.5-1-1-1s-1 .5-1 1H5zm0 8c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5-1 2.5-2.5 2.5S5 17.5 5 16zm2 0c0 .3.2.5.5.5s.5-.2.5-.5-.2-.5-.5-.5-.5.2-.5.5zm7-8c0-1.5 1-2.5 2.5-2.5S19 6.5 19 8c0 2-2.5 2.5-2.5 5h-2c0-3 2.5-3.5 2.5-5 0-.5-.5-1-1-1s-1 .5-1 1h-1.5zm0 8c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5-1 2.5-2.5 2.5-2.5-1-2.5-2.5zm2 0c0 .3.2.5.5.5s.5-.2.5-.5-.2-.5-.5-.5-.5.2-.5.5z" fill="#1A1A1A"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/>
  </svg>
);

const DefaultChannelIcon = () => (
  <Store className="h-5 w-5 text-muted-foreground" />
);

const BalcaoIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M4 6h16v2H4zm0 5h16v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-6zm2 2v4h12v-4H6z" fill="currentColor" className="text-primary"/>
  </svg>
);

const getChannelIcon = (name: string): React.ReactNode => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("ifood")) return <IFoodIcon />;
  if (lowerName.includes("rappi")) return <RappiIcon />;
  if (lowerName.includes("99") || lowerName.includes("food")) return <Food99Icon />;
  if (lowerName.includes("whatsapp") || lowerName.includes("zap")) return <WhatsAppIcon />;
  if (lowerName.includes("balcão") || lowerName.includes("balcao") || lowerName.includes("loja")) return <BalcaoIcon />;
  return <DefaultChannelIcon />;
};

export interface ChannelPricingData {
  channelId: string;
  targetMargin: number;
  finalPrice: number;
  isActive?: boolean;
}

interface MultiChannelPricingPanelProps {
  baseCost: number; // Custo base por unidade (ingredientes + embalagens)
  recipeYield: number;
  channelPricingData: ChannelPricingData[];
  onPricingChange: (channelId: string, targetMargin: number, finalPrice: number, isActive?: boolean) => void;
  minProfitMargin?: number; // Margem mínima alvo do usuário
}

interface ChannelCalculation {
  channel: SalesChannel;
  baseCost: number;
  totalFeePercent: number;
  totalFeeValue: number;
  targetMargin: number;
  suggestedPrice: number;
  finalPrice: number;
  netProfit: number;
  effectiveMargin: number;
  isMarginBelowTarget: boolean;
}

export function MultiChannelPricingPanel({
  baseCost,
  recipeYield,
  channelPricingData,
  onPricingChange,
  minProfitMargin = 0,
}: MultiChannelPricingPanelProps) {
  const { channels, loading, addChannel, updateChannel, deleteChannel } = useSalesChannels();
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);
  
  // Track active channels locally
  const [activeChannels, setActiveChannels] = useState<Set<string>>(new Set());
  
  // Track the last global margin that was synced to detect explicit changes
  const lastSyncedMarginRef = useRef<number>(minProfitMargin);
  // Track if channels have been initialized
  const initializedRef = useRef(false);

  // Initialize active channels from existing pricing data
  useEffect(() => {
    if (channelPricingData.length > 0) {
      setActiveChannels(new Set(channelPricingData.filter(p => p.isActive !== false).map(p => p.channelId)));
    } else if (channels.length > 0) {
      setActiveChannels(new Set(channels.map(c => c.id)));
    }
  }, [channels.length]);

  // Helper to calculate suggested price from cost, margin and fees
  const calculateSuggestedPrice = (
    cost: number,
    margin: number,
    totalFeePercent: number
  ): number => {
    if (cost <= 0) return 0;
    const priceWithMargin = cost * (1 + margin / 100);
    const finalPrice = totalFeePercent >= 100 ? priceWithMargin : priceWithMargin / (1 - totalFeePercent / 100);
    return Math.round(finalPrice * 100) / 100;
  };

  // Sync global margin → all channels ONLY on explicit global margin change
  useEffect(() => {
    if (!channels || channels.length === 0) return;

    const globalMarginChanged = lastSyncedMarginRef.current !== minProfitMargin;
    const needsInit = !initializedRef.current;

    if (!globalMarginChanged && !needsInit) return;

    lastSyncedMarginRef.current = minProfitMargin;
    initializedRef.current = true;

    channels.forEach((ch) => {
      const saved = channelPricingData.find((p) => p.channelId === ch.id);
      const hasExistingData = saved && (saved.finalPrice > 0 || saved.targetMargin !== 0);

      // Only auto-fill if: no data yet OR global margin explicitly changed
      if (!hasExistingData || globalMarginChanged) {
        const totalFeePercent =
          (ch.platformFee || 0) +
          (ch.paymentFee || 0) +
          (ch.cardFee || 0) +
          (ch.applyAnticipation ? ch.anticipationFee || 0 : 0);

        const suggestedPrice = calculateSuggestedPrice(baseCost, minProfitMargin, totalFeePercent);
        onPricingChange(ch.id, minProfitMargin, suggestedPrice);
      }
    });
  }, [minProfitMargin]); // ONLY react to global margin changes

  // Calcula lucro líquido: Preço Final - Custo Base - Taxas(R$)
  const calculateNetProfit = (
    price: number,
    cost: number,
    totalFeePercent: number
  ): number => {
    const feeValue = price * (totalFeePercent / 100);
    return price - cost - feeValue;
  };

  // Calcula margem efetiva (ROI): (Lucro Líquido / Custo Base) × 100
  const calculateEffectiveMargin = (
    price: number,
    cost: number,
    totalFeePercent: number
  ): number => {
    if (cost <= 0) return 0;
    const netProfit = calculateNetProfit(price, cost, totalFeePercent);
    return (netProfit / cost) * 100;
  };

  // Gera os cálculos para cada canal
  const channelCalculations: ChannelCalculation[] = useMemo(() => {
    return channels.map((channel) => {
      const totalFeePercent =
        (channel.platformFee || 0) +
        (channel.paymentFee || 0) +
        (channel.cardFee || 0) +
        (channel.applyAnticipation ? channel.anticipationFee || 0 : 0);

      const savedData = channelPricingData.find((p) => p.channelId === channel.id);
      const targetMargin = savedData?.targetMargin ?? minProfitMargin;
      const suggestedPrice = calculateSuggestedPrice(baseCost, targetMargin, totalFeePercent);
      
      const finalPrice = savedData?.finalPrice && savedData.finalPrice > 0 
        ? savedData.finalPrice 
        : suggestedPrice;

      const totalFeeValue = finalPrice * (totalFeePercent / 100);
      const netProfit = calculateNetProfit(finalPrice, baseCost, totalFeePercent);
      const effectiveMargin = calculateEffectiveMargin(finalPrice, baseCost, totalFeePercent);
      const isMarginBelowTarget = effectiveMargin < minProfitMargin;

      return {
        channel,
        baseCost,
        totalFeePercent,
        totalFeeValue,
        targetMargin,
        suggestedPrice,
        finalPrice,
        netProfit,
        effectiveMargin,
        isMarginBelowTarget,
      };
    });
  }, [channels, baseCost, channelPricingData, minProfitMargin]);

  const ifoodReferencePrice = useMemo(() => {
    const ifood = channelCalculations.find((c) =>
      c.channel.name.toLowerCase().includes("ifood")
    );
    return ifood?.finalPrice && ifood.finalPrice > 0 ? ifood.finalPrice : null;
  }, [channelCalculations]);

  const bestAtIfoodChannelId = useMemo(() => {
    if (!ifoodReferencePrice) return null;
    let best: { channelId: string; netProfit: number } | null = null;
    for (const c of channelCalculations) {
      const netProfitAtIfood = calculateNetProfit(ifoodReferencePrice, baseCost, c.totalFeePercent);
      if (!best || netProfitAtIfood > best.netProfit) {
        best = { channelId: c.channel.id, netProfit: netProfitAtIfood };
      }
    }
    return best?.channelId || null;
  }, [ifoodReferencePrice, channelCalculations, baseCost]);

  // Editar margem de UM canal → recalcula preço desse canal apenas
  const handleMarginChange = (channelId: string, newMargin: number) => {
    const calc = channelCalculations.find((c) => c.channel.id === channelId);
    if (!calc) return;
    const newPrice = calculateSuggestedPrice(baseCost, newMargin, calc.totalFeePercent);
    onPricingChange(channelId, newMargin, newPrice);
  };

  // Editar preço final de UM canal → recalcula margem desse canal apenas
  const handleFinalPriceChange = (channelId: string, newPrice: number) => {
    const calc = channelCalculations.find((c) => c.channel.id === channelId);
    if (!calc) return;

    const feeValue = newPrice * (calc.totalFeePercent / 100);
    const netProfit = newPrice - baseCost - feeValue;
    const newMargin = baseCost > 0 ? Math.round((netProfit / baseCost) * 1000) / 10 : 0;

    // Canal individual: só atualiza esse canal
    onPricingChange(channelId, newMargin, newPrice);
  };

  const handleToggleChannel = (channelId: string, active: boolean) => {
    setActiveChannels(prev => {
      const next = new Set(prev);
      if (active) next.add(channelId);
      else next.delete(channelId);
      return next;
    });
    const saved = channelPricingData.find(p => p.channelId === channelId);
    onPricingChange(channelId, saved?.targetMargin ?? minProfitMargin, saved?.finalPrice ?? 0, active);
  };

  const handleAddChannel = async () => {
    const newChannel = await addChannel({
      name: "Novo Canal",
      platformFee: 0,
      paymentFee: 0,
      cardFee: 0,
      anticipationFee: 0,
      applyAnticipation: false,
      monthlyFee: 0,
    });
    if (newChannel) {
      setEditingChannel(newChannel);
    }
  };

  const handleSaveChannelEdit = async () => {
    if (editingChannel) {
      await updateChannel(editingChannel.id, editingChannel);
      setEditingChannel(null);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    await deleteChannel(channelId);
  };

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Carregando canais...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Painel de Precificação Multi-Canal
            </CardTitle>
            <CardDescription>
              Defina preços específicos para cada canal de venda. Os cálculos atualizam em tempo real.
            </CardDescription>
          </div>
          <Button onClick={handleAddChannel} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Canal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum canal cadastrado.</p>
            <Button onClick={handleAddChannel} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Canal
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Ativo</TableHead>
                  <TableHead className="w-[160px]">Canal</TableHead>
                  <TableHead className="text-right">Custo Base</TableHead>
                  <TableHead className="text-right">Taxas (%)</TableHead>
                  <TableHead className="text-right">Taxas (R$)</TableHead>
                  <TableHead className="text-center w-[100px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Margem de Lucro (%)</TooltipTrigger>
                        <TooltipContent>
                          <p>Margem de lucro desejada para este canal</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right">Preço Sugerido</TableHead>
                  <TableHead className="text-center w-[120px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Preço Final</TooltipTrigger>
                        <TooltipContent>
                          <p>Preço de venda que você deseja praticar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right">Lucro Líq.</TableHead>
                  <TableHead className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Margem Real</TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Margem real = (Lucro Líq. ÷ Custo Base) × 100. Pode ficar negativa quando o preço não cobre custo + taxas.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelCalculations.map((calc) => (
                  <TableRow 
                    key={calc.channel.id}
                    className={cn(
                      calc.isMarginBelowTarget && "bg-destructive/5"
                    )}
                  >
                    <TableCell className="text-center">
                      <Switch
                        checked={activeChannels.has(calc.channel.id)}
                        onCheckedChange={(checked) => handleToggleChannel(calc.channel.id, checked)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">{getChannelIcon(calc.channel.name)}</div>
                        <div>
                          <span className="font-medium">{calc.channel.name}</span>
                          {ifoodReferencePrice && bestAtIfoodChannelId === calc.channel.id && (
                            <Badge variant="secondary" className="ml-2">
                              Mais rentável @ iFood
                            </Badge>
                          )}
                          {calc.isMarginBelowTarget && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-3 w-3 text-destructive ml-1 inline" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Margem abaixo do alvo mínimo ({minProfitMargin}%)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(calc.baseCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {calc.totalFeePercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(calc.totalFeeValue)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={calc.targetMargin}
                        onChange={(e) =>
                          handleMarginChange(
                            calc.channel.id,
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-[80px] text-center mx-auto"
                        min={0}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(calc.suggestedPrice)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={calc.finalPrice || ""}
                        onChange={(e) =>
                          handleFinalPriceChange(
                            calc.channel.id,
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-[100px] text-right mx-auto font-mono"
                        step="0.01"
                        min={0}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          calc.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                        )}
                      >
                        {formatCurrency(calc.netProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {calc.effectiveMargin >= calc.targetMargin ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            calc.effectiveMargin >= minProfitMargin
                              ? "text-green-600 dark:text-green-400"
                              : "text-destructive"
                          )}
                        >
                          {calc.effectiveMargin.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingChannel({ ...calc.channel })}
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configurar Canal</DialogTitle>
                            <DialogDescription>
                              Ajuste as taxas e configurações deste canal de venda.
                            </DialogDescription>
                          </DialogHeader>
                          {editingChannel && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Nome do Canal</Label>
                                <Input
                                  value={editingChannel.name}
                                  onChange={(e) =>
                                    setEditingChannel({ ...editingChannel, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Comissão Plataforma (%)</Label>
                                  <Input
                                    type="number"
                                    value={editingChannel.platformFee || ""}
                                    onChange={(e) =>
                                      setEditingChannel({
                                        ...editingChannel,
                                        platformFee: Number(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Taxa de Pagamento (%)</Label>
                                  <Input
                                    type="number"
                                    value={editingChannel.paymentFee || ""}
                                    onChange={(e) =>
                                      setEditingChannel({
                                        ...editingChannel,
                                        paymentFee: Number(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Taxa Cartão (%)</Label>
                                  <Input
                                    type="number"
                                    value={editingChannel.cardFee || ""}
                                    onChange={(e) =>
                                      setEditingChannel({
                                        ...editingChannel,
                                        cardFee: Number(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Taxa Antecipação (%)</Label>
                                  <Input
                                    type="number"
                                    value={editingChannel.anticipationFee || ""}
                                    onChange={(e) =>
                                      setEditingChannel({
                                        ...editingChannel,
                                        anticipationFee: Number(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingChannel.applyAnticipation}
                                  onCheckedChange={(checked) =>
                                    setEditingChannel({ ...editingChannel, applyAnticipation: checked })
                                  }
                                />
                                <Label>Aplicar Antecipação</Label>
                              </div>
                              <div className="flex justify-between pt-4">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    handleDeleteChannel(editingChannel.id);
                                    setEditingChannel(null);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                                <Button onClick={handleSaveChannelEdit}>Salvar</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Resumo geral */}
        {channelCalculations.length > 0 && (
          <div className="mt-6 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Canais Ativos</p>
              <p className="text-2xl font-bold text-primary">{channels.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Maior Lucro</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(Math.max(...channelCalculations.map((c) => c.netProfit)))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Menor Lucro</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(Math.min(...channelCalculations.map((c) => c.netProfit)))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Margem Média</p>
              <p className="text-2xl font-bold">
                {(
                  channelCalculations.reduce((sum, c) => sum + c.effectiveMargin, 0) /
                  channelCalculations.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

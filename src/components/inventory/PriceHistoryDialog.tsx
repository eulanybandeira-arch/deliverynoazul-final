import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from "lucide-react";
import { useInventoryEntries, PriceVariation } from "@/hooks/useInventoryEntries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
}

export function PriceHistoryDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
}: PriceHistoryDialogProps) {
  const { entries, loading, getPriceVariation } = useInventoryEntries(itemId);
  const [variations, setVariations] = useState<PriceVariation[]>([]);

  useEffect(() => {
    if (open && entries.length > 0) {
      setVariations(getPriceVariation());
    }
  }, [open, entries, getPriceVariation]);

  // Dados para o gráfico de linha
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];
    
    return [...entries]
      .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
      .map((entry) => ({
        date: format(new Date(entry.purchase_date), "dd/MM/yy"),
        fullDate: format(new Date(entry.purchase_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
        price: entry.unit_cost,
        supplier: entry.supplier || "Não informado",
      }));
  }, [entries]);

  const avgPrice = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.unit_cost, 0) / entries.length;
  }, [entries]);

  const chartConfig = {
    price: {
      label: "Preço",
      color: "hsl(var(--primary))",
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const getVariationIcon = (percent: number) => {
    if (percent > 5) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (percent < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getVariationBadge = (percent: number) => {
    if (percent > 10) return <Badge variant="destructive">+{percent.toFixed(1)}%</Badge>;
    if (percent > 5) return <Badge className="bg-orange-500">+{percent.toFixed(1)}%</Badge>;
    if (percent < -5) return <Badge className="bg-green-500">{percent.toFixed(1)}%</Badge>;
    return <Badge variant="secondary">{percent > 0 ? "+" : ""}{percent.toFixed(1)}%</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Histórico de Preços: {itemName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum histórico de compras encontrado.</p>
            <p className="text-sm">Registre compras para ver a variação de preços.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gráfico de Evolução de Preços */}
            {chartData.length > 1 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-4">Evolução de Preços</h4>
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }} 
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `R$${value.toFixed(0)}`}
                        className="text-muted-foreground"
                        width={60}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="text-xs text-muted-foreground">{data.fullDate}</p>
                                <p className="font-semibold text-primary">
                                  {formatCurrency(data.price)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Fornecedor: {data.supplier}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine 
                        y={avgPrice} 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="5 5"
                        label={{ 
                          value: `Média: ${formatCurrency(avgPrice)}`, 
                          position: "right",
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))"
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}

            {/* Resumo Geral */}
            {entries.length > 1 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Resumo Geral</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Menor preço:</span>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(Math.min(...entries.map((e) => e.unit_cost)))}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Maior preço:</span>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(Math.max(...entries.map((e) => e.unit_cost)))}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total de compras:</span>
                    <p className="font-semibold">{entries.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Variação por Mês */}
            <div className="space-y-3">
              <h4 className="font-medium">Variação por Mês</h4>
              {variations.map((variation) => (
                <div
                  key={variation.month}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {formatMonth(variation.month)}
                    </span>
                    <div className="flex items-center gap-2">
                      {getVariationIcon(variation.variationPercent)}
                      {getVariationBadge(variation.variationPercent)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Compras:</span>
                      <p className="font-medium">{variation.purchases}x</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mín:</span>
                      <p className="font-medium text-green-600">
                        {formatCurrency(variation.minPrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Máx:</span>
                      <p className="font-medium text-destructive">
                        {formatCurrency(variation.maxPrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Média:</span>
                      <p className="font-medium">{formatCurrency(variation.avgPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lista de Compras Recentes */}
            <div className="space-y-3">
              <h4 className="font-medium">Compras Recentes</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {format(new Date(entry.purchase_date), "dd/MM/yyyy")}
                      </span>
                      {entry.supplier && (
                        <Badge variant="outline" className="text-xs">
                          {entry.supplier}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {entry.quantity} un
                      </span>
                      <span className="font-medium">
                        {formatCurrency(entry.unit_cost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

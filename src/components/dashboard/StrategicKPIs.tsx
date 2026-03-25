import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, ChefHat, Bike, PiggyBank, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPIProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: { value: string; positive: boolean };
  icon: React.ElementType;
  statusColor: "green" | "orange" | "blue" | "red";
  tooltipText: string;
}

function KPICard({ title, value, subValue, trend, icon: Icon, statusColor, tooltipText }: KPIProps) {
  const colorClasses = {
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px] text-xs leading-relaxed">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className={cn("p-2 rounded-lg", colorClasses[statusColor])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trend.positive ? "text-green-500" : "text-red-500"
            )}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {subValue && <span className="text-[10px] text-muted-foreground font-medium">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

interface StrategicKPIsProps {
  data: {
    faturamento: { value: string; trend: string; positive: boolean };
    cmv: { value: string; trend: string; positive: boolean };
    canais: { value: string; sub: string };
    margem: { value: string; sub: string };
  };
}

export function StrategicKPIs({ data }: StrategicKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Faturamento Bruto"
        value={data.faturamento.value}
        trend={{ value: data.faturamento.trend, positive: data.faturamento.positive }}
        icon={Banknote}
        statusColor="blue"
        tooltipText="Total de Vendas - Soma de todos os pedidos realizados no período selecionado."
      />
      <KPICard
        title="CMV Cozinha (Insumos)"
        value={data.cmv.value}
        subValue="EI + C - EF"
        trend={{ value: data.cmv.trend, positive: data.cmv.positive }}
        icon={ChefHat}
        statusColor="green"
        tooltipText="Neurobusiness: Custo Puro da Cozinha - Fórmula: ((EI + C - EF) / Faturamento Bruto) * 100. Representa quanto da venda serviu apenas para repor insumos."
      />
      <KPICard
        title="Custos de Canais"
        value={data.canais.value}
        subValue={data.canais.sub}
        icon={Bike}
        statusColor="orange"
        tooltipText="Erosão Logística - Soma de Taxas iFood, Taxas de Cartão e Embalagens. Mostra quanto do faturamento foi consumido pelas plataformas e logística."
      />
      <KPICard
        title="Margem de Contribuição"
        value={data.margem.value}
        subValue={data.margem.sub}
        icon={PiggyBank}
        statusColor="blue"
        tooltipText="Sobrevivência do Negócio - Fórmula: Faturamento Bruto - (CMV Cozinha + Custos de Canais). Este é o valor real que sobra para pagar as despesas fixas."
      />
    </div>
  );
}
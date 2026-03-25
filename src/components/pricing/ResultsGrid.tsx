import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/pricing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ResultsGridProps {
  totalCost: number;
  fixedExpenseProportional: number;
  suggestedPrice: number;
  totalRevenue: number;
  netProfit: number;
  calculationSteps: string[];
}

export function ResultsGrid({
  totalCost,
  fixedExpenseProportional,
  suggestedPrice,
  totalRevenue,
  netProfit,
  calculationSteps,
}: ResultsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="bg-metric-orange/20 border border-metric-orange">
        <CardHeader>
          <CardDescription className="text-metric-orange">Custo Total</CardDescription>
          <CardTitle className="text-3xl text-metric-orange">{formatCurrency(totalCost)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-metric-red/20 border border-metric-red">
        <CardHeader>
          <CardDescription className="text-metric-red">Despesa Fixa Proporcional</CardDescription>
          <CardTitle className="text-3xl text-metric-red">{formatCurrency(fixedExpenseProportional)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-metric-cyan/20 border border-metric-cyan">
        <CardHeader>
          <CardDescription className="text-metric-cyan flex items-center gap-1">
            Preço Sugerido
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Este é o preço base com a margem global aplicada, <strong>sem taxas de canais</strong>. 
                    No painel multi-canal, o preço final inclui as taxas específicas de cada plataforma (iFood, Rappi, etc.).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
          <CardTitle className="text-3xl flex items-center gap-2 text-metric-cyan">
            {formatCurrency(suggestedPrice)}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 p-2">
                    <p className="font-semibold">Cálculo:</p>
                    {calculationSteps.map((step, i) => <p key={i} className="text-xs">{step}</p>)}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <p className="text-xs text-metric-cyan/70 mt-1">
            Preço base • Veja taxas por canal abaixo
          </p>
        </CardHeader>
      </Card>
      <Card className="bg-metric-gold/20 border border-metric-gold">
        <CardHeader>
          <CardDescription className="text-metric-gold">Faturamento</CardDescription>
          <CardTitle className="text-3xl text-metric-gold">{formatCurrency(totalRevenue)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="bg-primary/20 border border-primary">
        <CardHeader>
          <CardDescription className="text-primary">Lucro Líquido</CardDescription>
          <CardTitle className="text-3xl text-primary">{formatCurrency(netProfit)}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
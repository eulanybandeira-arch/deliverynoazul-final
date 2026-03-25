import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinearProfitGaugeProps {
  profitMargin: number;
  onProfitMarginChange: (value: number) => void;
}

export function LinearProfitGauge({ profitMargin, onProfitMarginChange }: LinearProfitGaugeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Margem de Lucro
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Referência para todos os canais
          </span>
        </CardTitle>
        <CardDescription>
          Esta margem será aplicada como base no preço sugerido e herdada pelos canais de venda. 
          Ajustes no painel multi-canal também atualizam este valor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="text-6xl font-bold">{profitMargin.toFixed(0)}</span>
            <span className="absolute -right-5 top-1 text-xl font-bold text-muted-foreground">%</span>
          </div>
          <div className="flex-1 space-y-2">
            <Slider
              value={[Math.min(profitMargin, 500)]}
              onValueChange={(value) => onProfitMarginChange(value[0])}
              max={500}
              step={1}
              className="profit-slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Baixa</span>
              <span>Média</span>
              <span>Ideal</span>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="profit-margin-input">Definir Margem Manualmente (%)</Label>
          <Input
            id="profit-margin-input"
            type="number"
            value={profitMargin === 0 ? '' : profitMargin}
            onChange={(e) => {
              const value = Number(e.target.value) || 0;
              onProfitMarginChange(Math.max(0, value));
            }}
            placeholder="0"
            step="1"
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
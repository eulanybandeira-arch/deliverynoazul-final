import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Brain } from "lucide-react";

interface CMVDataPoint {
  label: string;
  cmv: number;
  intervention?: string;
  date?: string;
  impact?: string;
}

interface CMVChartProps {
  data: CMVDataPoint[];
  viewLabel: string;
}

const CustomTooltip = ({ active, payload, label, data }: any) => {
  if (active && payload && payload.length) {
    const item = data.find((d: any) => d.label === label);
    return (
      <div className="bg-background/95 backdrop-blur border border-border p-3 rounded-lg shadow-xl">
        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">{label}</p>
        <p className="text-lg font-bold text-primary">CMV: {payload[0].value}%</p>
        {item?.intervention && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-[10px] font-bold text-orange-500 flex items-center gap-1 uppercase">
              <Brain className="h-3 w-3" /> INTERVENÇÃO DE GESTÃO
            </p>
            <p className="text-xs font-medium mt-0.5">{item.intervention}</p>
            {item.date && <p className="text-[10px] text-muted-foreground mt-1">[Data: {item.date}]</p>}
            {item.impact && <p className="text-[10px] text-green-500 font-semibold mt-1">{item.impact}</p>}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function CMVChart({ data, viewLabel }: CMVChartProps) {
  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Evolução do CMV vs. Intervenções
          <span className="text-[10px] font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
            {viewLabel}
          </span>
        </CardTitle>
        <CardDescription>
          Visualize como suas ações táticas impactam diretamente na redução da erosão de lucro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip data={data} />} />
              <Line 
                type="monotone" 
                dataKey="cmv" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.intervention) {
                    return (
                      <svg x={cx - 10} y={cy - 10} width={20} height={20} className="text-orange-500 drop-shadow-lg cursor-pointer">
                        <circle cx="10" cy="10" r="6" fill="currentColor" />
                        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="animate-ping" />
                      </svg>
                    );
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />;
                }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
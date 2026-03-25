import { useState, useMemo } from "react";
import { StrategicKPIs } from "@/components/dashboard/StrategicKPIs";
import { CMVChart } from "@/components/dashboard/CMVChart";
import { BottleneckClinic, Bottleneck, Intervention } from "@/components/dashboard/BottleneckClinic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Brain } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const getMockData = (view: string) => {
  const views: Record<string, any> = {
    semanal: {
      kpis: {
        faturamento: { value: "R$ 12.450,00", trend: "+5.2%", positive: true },
        cmv: { value: "34.1%", trend: "-1.2%", positive: true },
        canais: { value: "29.2%", sub: "iFood 27% | Cartão 2.2%" },
        margem: { value: "R$ 4.568,00", sub: "36.7% do fat." },
      },
      chart: [
        { label: "Seg", cmv: 35.2 },
        { label: "Ter", cmv: 34.8 },
        { label: "Qua", cmv: 34.1 },
        { label: "Qui", cmv: 33.9 },
        { label: "Sex", cmv: 34.5 },
        { label: "Sáb", cmv: 35.8 },
        { label: "Dom", cmv: 36.2 },
      ]
    },
    mensal: {
      kpis: {
        faturamento: { value: "R$ 48.920,00", trend: "+12.5%", positive: true },
        cmv: { value: "32.8%", trend: "-2.4%", positive: true },
        canais: { value: "28.5%", sub: "iFood 26.5% | Cartão 2%" },
        margem: { value: "R$ 18.940,00", sub: "38.7% do fat." },
      },
      chart: [
        { label: "Sem 1", cmv: 34.5 },
        { label: "Sem 2", cmv: 33.8 },
        { label: "Sem 3", cmv: 32.4 },
        { label: "Sem 4", cmv: 31.9 },
      ]
    },
    trimestral: {
      kpis: {
        faturamento: { value: "R$ 142.300,00", trend: "+8.2%", positive: true },
        cmv: { value: "32.4%", trend: "-2.1%", positive: true },
        canais: { value: "28.7%", sub: "iFood 27% | Cartão 1.7%" },
        margem: { value: "R$ 55.497,00", sub: "39% do fat." },
      },
      chart: [
        { label: "Jan-1", cmv: 38.5 },
        { label: "Jan-2", cmv: 37.2, intervention: "Treinamento Chapeiro João", date: "12/01", impact: "Redução 1.3% CMV" },
        { label: "Jan-3", cmv: 36.8 },
        { label: "Jan-4", cmv: 36.0 },
        { label: "Fev-1", cmv: 35.5 },
        { label: "Fev-2", cmv: 35.8 },
        { label: "Fev-3", cmv: 34.2, intervention: "Ajuste Ficha Técnica Burger", date: "18/02", impact: "Redução 1.6% CMV" },
        { label: "Fev-4", cmv: 33.5 },
        { label: "Mar-1", cmv: 32.4, intervention: "Troca Fornecedor Carne", date: "05/03", impact: "Redução 1.1% CMV" },
        { label: "Mar-2", cmv: 32.1 },
      ]
    }
  };
  return views[view] || views.trimestral;
};

export default function Dashboard() {
  const [view, setView] = useState("trimestral");
  
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([
    { id: "1", title: "🥩 Furo Inventário: Carne", description: "Contagem de 8kg vs. Sistema 10kg", impact: "Perda R$ 180,00", type: "inventory", resolved: false },
    { id: "2", title: "🧀 Mussarela: Preço", description: "Aumento de +12% no último pedido", impact: "Erosão 1.5% Margem", type: "price", resolved: false },
  ]);

  const [interventions, setInterventions] = useState<Intervention[]>([
    { id: "i1", title: "Treinamento João", date: "12/03", status: "concluido" },
    { id: "i2", title: "Implantação Ficha Bebidas", date: "15/03", status: "em_andamento" },
  ]);

  const currentData = useMemo(() => getMockData(view), [view]);

  const handleResolveBottleneck = (id: string, actionType: string, notes: string) => {
    const bottleneck = bottlenecks.find(b => b.id === id);
    if (!bottleneck) return;

    setBottlenecks(prev => prev.map(b => b.id === id ? { ...b, resolved: true } : b));

    const newIntervention: Intervention = {
      id: `int-${Date.now()}`,
      title: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)}: ${bottleneck.title.split(':')[1].trim()}`,
      date: format(new Date(), "dd/MM"),
      status: "concluido"
    };
    setInterventions(prev => [newIntervention, ...prev]);

    toast.success("Intervenção registrada!", {
      description: "Um novo alfinete de gestão foi adicionado ao seu histórico.",
      icon: <Brain className="h-4 w-4 text-primary" />,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Estratégico
          </h1>
          <p className="text-muted-foreground mt-1">
            Painel de Controle de Danos e Engenharia de Lucro.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/40 backdrop-blur-sm p-1.5 rounded-xl border border-border/40">
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Calendar className="h-3.5 w-3.5" />
            Vista:
          </div>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[160px] h-9 border-none bg-transparent focus:ring-0 font-semibold text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="quinzenal">Quinzenal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <StrategicKPIs data={currentData.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <CMVChart 
            data={currentData.chart} 
            viewLabel={view.charAt(0).toUpperCase() + view.slice(1)} 
          />
        </div>
        <div className="lg:col-span-1">
          <BottleneckClinic 
            bottlenecks={bottlenecks} 
            interventions={interventions}
            onResolve={handleResolveBottleneck}
          />
        </div>
      </div>
    </div>
  );
}
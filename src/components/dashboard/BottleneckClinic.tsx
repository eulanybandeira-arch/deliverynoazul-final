import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { ResolveBottleneckModal } from "./ResolveBottleneckModal";
import { useState } from "react";

export interface Bottleneck {
  id: string;
  title: string;
  description: string;
  impact: string;
  type: "inventory" | "price";
  resolved: boolean;
}

export interface Intervention {
  id: string;
  title: string;
  date: string;
  status: "concluido" | "em_andamento";
}

interface BottleneckClinicProps {
  bottlenecks: Bottleneck[];
  interventions: Intervention[];
  onResolve: (bottleneckId: string, actionType: string, notes: string) => void;
}

function BottleneckAlert({ bottleneck, onResolve }: { bottleneck: Bottleneck; onResolve: () => void }) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${
      bottleneck.resolved 
        ? "border-green-500/20 bg-green-500/5 opacity-80" 
        : "border-red-500/20 bg-red-500/5"
    } space-y-3`}>
      <div className="flex items-start gap-2">
        {bottleneck.resolved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-bold leading-tight ${bottleneck.resolved ? "text-green-700 dark:text-green-400" : ""}`}>
            {bottleneck.title}
          </h4>
          <p className="text-[11px] text-muted-foreground mt-1">{bottleneck.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${bottleneck.resolved ? "text-green-600" : "text-red-500"}`}>
          {bottleneck.resolved ? "Ação Registrada" : `Impacto: ${bottleneck.impact}`}
        </span>
        {!bottleneck.resolved && (
          <Button 
            size="sm" 
            variant="destructive" 
            className="h-7 text-[10px] px-2 font-bold uppercase tracking-wider"
            onClick={onResolve}
          >
            Resolver Gargalo
          </Button>
        )}
      </div>
    </div>
  );
}

export function BottleneckClinic({ bottlenecks, interventions, onResolve }: BottleneckClinicProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBottleneck, setSelectedBottleneck] = useState<Bottleneck | null>(null);

  const handleOpenResolve = (bottleneck: Bottleneck) => {
    setSelectedBottleneck(bottleneck);
    setIsModalOpen(true);
  };

  const handleConfirmResolve = (actionType: string, notes: string) => {
    if (selectedBottleneck) {
      onResolve(selectedBottleneck.id, actionType, notes);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Clínica de Gargalos (Erosão)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bottlenecks.map((b) => (
            <BottleneckAlert 
              key={b.id} 
              bottleneck={b} 
              onResolve={() => handleOpenResolve(b)} 
            />
          ))}

          <div className="pt-4 border-t border-border/50">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Intervenções Ativas
            </h4>
            <div className="space-y-2">
              {interventions.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-xs">
                  {i.status === "concluido" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  )}
                  <span className="font-medium">{i.title} ({i.date})</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBottleneck && (
        <ResolveBottleneckModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          bottleneckTitle={selectedBottleneck.title}
          onConfirm={handleConfirmResolve}
        />
      )}
    </div>
  );
}
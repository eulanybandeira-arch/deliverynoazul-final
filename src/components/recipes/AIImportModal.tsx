import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";

interface AIImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessComplete: (data: any) => void;
}

export function AIImportModal({ open, onOpenChange, onProcessComplete }: AIImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startProcessing = () => {
    setIsProcessing(true);
    
    // Simulação de 2 segundos de processamento por IA
    setTimeout(() => {
      const simulatedData = {
        name: "Hambúrguer Gourmet Especial",
        yieldAmount: "4",
        yieldUnit: "Unidade",
        salesVolume: "Alta Venda",
        isAiProcessed: true,
        ingredients: [
          { id: "ai-1", name: "Pão Brioche", quantity: 4, unit: "un", unitPrice: 1.50, cost: 6.00 },
          { id: "ai-2", name: "Carne Bovina (Blend)", quantity: 0.8, unit: "kg", unitPrice: 35.00, cost: 28.00 },
          { id: "ai-3", name: "Queijo Cheddar", quantity: 0.2, unit: "kg", unitPrice: 40.00, cost: 8.00 },
          { id: "ai-4", name: "Bacon Fatiado", quantity: 0.1, unit: "kg", unitPrice: 45.00, cost: 4.50 },
          { id: "ai-5", name: "Maionese da Casa", quantity: 0.1, unit: "kg", unitPrice: 20.00, cost: 2.00 },
        ],
        packaging: [
          { id: "ai-p1", name: "Caixa de Hambúrguer", quantity: 4, unit: "un", unitPrice: 1.20, cost: 4.80 },
        ],
        instructions: "1. Modele os hambúrgueres com 200g cada.\n2. Tempere com sal e pimenta apenas na hora de grelhar.\n3. Sele o pão com manteiga na chapa.\n4. Grelhe a carne por 3 minutos de cada lado para ponto médio.\n5. Derreta o queijo sobre a carne no último minuto.",
        targetCmv: "28",
        appliedPrice: "4500"
      };
      
      setIsProcessing(false);
      onProcessComplete(simulatedData);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startProcessing();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startProcessing();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isProcessing && onOpenChange(o)}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-slate-950 text-white shadow-2xl">
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
          {isProcessing ? (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Processando...</h2>
                <p className="text-slate-400 text-sm">Analisando documento com IA...</p>
              </div>
              
              <p className="text-primary/80 text-xs font-bold uppercase tracking-widest animate-pulse">
                Extraindo informações da receita...
              </p>
            </div>
          ) : (
            <div 
              className="w-full space-y-6 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" 
                onChange={handleFileSelect}
              />
              
              <div className="mx-auto w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-slate-800 transition-all duration-300">
                <Upload className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">🪄 Importar Ficha Técnica</h2>
                <p className="text-slate-400 text-sm px-4">
                  Arraste ou selecione sua receita em <span className="text-white">PDF, Imagem, Excel ou Word</span>.
                </p>
              </div>

              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                A IA preencherá tudo para você
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
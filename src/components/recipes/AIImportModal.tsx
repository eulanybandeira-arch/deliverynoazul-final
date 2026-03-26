import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessComplete: (data: any) => void;
}

type ModalState = "upload" | "processing" | "review";

export function AIImportModal({ open, onOpenChange, onProcessComplete }: AIImportModalProps) {
  const [modalState, setModalState] = useState<ModalState>("upload");
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startProcessing = () => {
    setModalState("processing");
    
    // Simulação de 2 segundos de processamento por IA
    setTimeout(() => {
      const simulatedData = {
        name: "Strogonoff de Frango",
        yieldAmount: "5",
        yieldUnit: "Porções",
        isAiProcessed: true,
        ingredients: [
          { id: "ai-1", name: "frango", mappedName: "FILE DE PEITO DE FRANGO", quantity: 0.88, unit: "kg", unitPrice: 14.99, cost: 13.19 },
          { id: "ai-2", name: "creme de leite", mappedName: "CREME LEITE", quantity: 0.4, unit: "g", unitPrice: 0.01, cost: 0.00 },
          { id: "ai-3", name: "extrato de tomate", mappedName: "EXTRATO DE TOMATE", quantity: 0.3, unit: "g", unitPrice: 0.01, cost: 0.00 },
          { id: "ai-4", name: "leite", mappedName: "LEITE INTEGRAL", quantity: 0.1, unit: "L", unitPrice: 4.98, cost: 0.50 },
          { id: "ai-5", name: "ketchup", mappedName: "KETCHUP TRADICIONAL", quantity: 0.05, unit: "kg", unitPrice: 15.98, cost: 0.80 },
        ],
        packaging: [],
        instructions: "1. Corte o frango em cubos e tempere.\n2. Refogue até dourar.\n3. Adicione o extrato de tomate e o ketchup.\n4. Finalize com o creme de leite em fogo baixo.",
        targetCmv: "25",
        appliedPrice: "3500"
      };
      
      setExtractedData(simulatedData);
      setModalState("review");
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startProcessing();
    }
  };

  const handleConfirmReview = () => {
    onProcessComplete(extractedData);
    resetModal();
  };

  const resetModal = () => {
    setModalState("upload");
    setExtractedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!isProcessing) { onOpenChange(o); if(!o) resetModal(); } }}>
      <DialogContent className={cn(
        "p-0 overflow-hidden border-none shadow-2xl transition-all duration-300",
        modalState === "processing" ? "sm:max-w-[400px] bg-slate-950 text-white" : "sm:max-w-[600px] bg-background"
      )}>
        
        {/* ESTADO 1: UPLOAD (Gatilho Instantâneo) */}
        {modalState === "upload" && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div 
              className="w-full space-y-6 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" 
                onChange={handleFileSelect}
              />
              <div className="mx-auto w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-accent transition-all duration-300">
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">🪄 Importar Ficha Técnica (IA)</h2>
                <p className="text-muted-foreground text-sm px-4">
                  Arraste ou selecione sua receita em <span className="font-bold text-foreground">PDF, Imagem, Excel ou Word</span>.
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                A Inteligência Artificial preencherá tudo para você
              </p>
            </div>
          </div>
        )}

        {/* ESTADO 2: PROCESSANDO (Dark Mode Premium) */}
        {modalState === "processing" && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
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
        )}

        {/* ESTADO 3: REVISÃO (Screenshot 6) */}
        {modalState === "review" && extractedData && (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Receita Extraída</h2>
                <p className="text-sm text-muted-foreground">Revise os dados extraídos antes de salvar</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Nome da Receita</Label>
                  <Input value={extractedData.name} readOnly className="bg-muted/50 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Rendimento</Label>
                  <Input value={`${extractedData.yieldAmount} ${extractedData.yieldUnit}`} readOnly className="bg-muted/50 font-bold" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Ingredientes</Label>
                  <Badge className="bg-[#2dceb6] hover:bg-[#2dceb6] text-white border-none text-[10px] font-bold">
                    ✓ {extractedData.ingredients.length} encontrados
                  </Badge>
                </div>

                <div className="space-y-2">
                  {extractedData.ingredients.map((ing: any) => (
                    <div key={ing.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-[#2dceb6]" />
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold">{ing.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">→ {ing.mappedName}</span>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalState("upload")}>Cancelar</Button>
              <Button onClick={handleConfirmReview} className="bg-[#002B5B] hover:bg-[#001f3f] font-bold px-8">
                Criar Receita
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const isProcessing = false; // Placeholder for the logic above
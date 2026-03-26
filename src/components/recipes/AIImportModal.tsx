import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Upload, X, FileText } from "lucide-react";

interface AIImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessComplete: (data: any) => void;
}

export function AIImportModal({ open, onOpenChange, onProcessComplete }: AIImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = () => {
    setIsProcessing(true);
    
    // Simulação de 2 segundos conforme solicitado
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
      setFile(null);
      onProcessComplete(simulatedData);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-lg">🪄</span> Importar Ficha Técnica (IA)
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in duration-300">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-bold text-lg">Processando...</p>
                <p className="text-sm text-muted-foreground">Analisando documento com IA...</p>
                <p className="text-sm text-muted-foreground">Extraindo informações da receita...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" 
                  onChange={handleFileSelect}
                />
                {file ? (
                  <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/20 w-full">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold">Arraste ou selecione sua receita</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Imagem, Excel ou Word</p>
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground px-6">
                A Inteligência Artificial preencherá a Ficha Técnica para você automaticamente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProcess} 
            disabled={!file || isProcessing}
            className={cn(
              "min-w-[140px] transition-colors",
              file && !isProcessing && "hover:bg-[#2dceb6] active:bg-[#2dceb6] focus:bg-[#2dceb6]"
            )}
            style={file && !isProcessing ? { backgroundColor: undefined } : {}}
          >
            {isProcessing ? "Lendo Arquivo..." : "Processar Arquivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
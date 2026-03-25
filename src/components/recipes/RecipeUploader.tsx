import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInventory } from "@/hooks/useInventory";

interface ExtractedIngredient {
  name: string;
  quantity: number;
  unit: string;
  matched?: boolean;
  inventoryId?: string;
  matchedName?: string;
}

interface ExtractedRecipe {
  name: string;
  yield: number;
  category: string;
  ingredients: ExtractedIngredient[];
  instructions: string;
}

interface RecipeUploaderProps {
  onRecipeExtracted: (recipe: ExtractedRecipe, hasUnmatchedIngredients: boolean) => void;
}

export function RecipeUploader({ onRecipeExtracted }: RecipeUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items: inventoryItems } = useInventory();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast.error("Formato não suportado. Use PDF, Word, Excel ou imagem.");
      return;
    }

    setIsProcessing(true);
    setIsOpen(true);

    try {
      let content: string;
      let contentType: string;

      // For Excel files, extract text content first
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                      file.type.includes('spreadsheet') || file.type.includes('excel');
      
      if (isExcel) {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const textParts: string[] = [];
        workbook.SheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          textParts.push(`--- ${name} ---\n${XLSX.utils.sheet_to_csv(sheet)}`);
        });
        content = textParts.join('\n\n');
        contentType = 'text';
      } else {
        const base64 = await fileToBase64(file);
        content = base64;
        contentType = file.type.startsWith('image/') ? 'image' : 'document';
      }

      const { data, error } = await supabase.functions.invoke('extract-recipe', {
        body: { content, contentType }
      });

      if (error) throw error;

      if (data.success && data.recipe) {
        // Match ingredients with inventory
        const matchedRecipe = matchIngredientsWithInventory(data.recipe);
        setExtractedRecipe(matchedRecipe);
      } else {
        throw new Error(data.error || "Falha ao extrair receita");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Erro ao processar arquivo. Tente novamente.");
      setIsOpen(false);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // Normalize text for matching - remove accents, lowercase, singular
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/s$/, "") // Basic plural removal
      .trim();
  };

  // Extract keywords from ingredient name
  const extractKeywords = (name: string): string[] => {
    const normalized = normalizeText(name);
    // Split by common separators and filter short words
    const words = normalized.split(/[\s,\-\/]+/).filter(w => w.length > 2);
    return words;
  };

  // Calculate match score between two strings (0-1)
  const calculateMatchScore = (str1: string, str2: string): number => {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    
    // Exact match
    if (s1 === s2) return 1;
    
    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Keyword matching
    const keywords1 = extractKeywords(str1);
    const keywords2 = extractKeywords(str2);
    
    let matchedKeywords = 0;
    for (const kw1 of keywords1) {
      for (const kw2 of keywords2) {
        if (kw1.includes(kw2) || kw2.includes(kw1)) {
          matchedKeywords++;
          break;
        }
      }
    }
    
    if (keywords1.length > 0 && matchedKeywords > 0) {
      return 0.5 + (matchedKeywords / keywords1.length) * 0.4;
    }
    
    return 0;
  };

  const matchIngredientsWithInventory = (recipe: ExtractedRecipe): ExtractedRecipe => {
    const matchedIngredients = recipe.ingredients.map(ing => {
      let bestMatch: typeof inventoryItems[0] | null = null;
      let bestScore = 0;
      
      // Find best matching inventory item
      for (const item of inventoryItems) {
        const score = calculateMatchScore(ing.name, item.name);
        if (score > bestScore && score >= 0.5) {
          bestScore = score;
          bestMatch = item;
        }
      }

      return {
        ...ing,
        matched: !!bestMatch,
        inventoryId: bestMatch?.id,
        matchedName: bestMatch?.name // Store matched name for display
      };
    });

    return {
      ...recipe,
      ingredients: matchedIngredients
    };
  };

  const handleConfirm = () => {
    if (!extractedRecipe) return;

    const hasUnmatched = extractedRecipe.ingredients.some(ing => !ing.matched);
    onRecipeExtracted(extractedRecipe, hasUnmatched);
    setIsOpen(false);
    setExtractedRecipe(null);
  };

  const matchedCount = extractedRecipe?.ingredients.filter(i => i.matched).length || 0;
  const unmatchedCount = extractedRecipe?.ingredients.filter(i => !i.matched).length || 0;

  return (
    <>
      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="recipe-upload"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="h-4 w-4 mr-2" />
          Importar Receita
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isProcessing ? "Processando..." : "Receita Extraída"}
            </DialogTitle>
            <DialogDescription>
              {isProcessing 
                ? "Analisando documento com IA..."
                : "Revise os dados extraídos antes de salvar"
              }
            </DialogDescription>
          </DialogHeader>

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Extraindo informações da receita...</p>
              <p className="text-xs text-muted-foreground mt-3">Formatos aceitos: Excel (.xlsx), PDF, Word e Imagens (JPG/PNG)</p>
            </div>
          ) : extractedRecipe && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Receita</Label>
                  <Input value={extractedRecipe.name} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Rendimento</Label>
                  <Input value={`${extractedRecipe.yield} porções`} readOnly className="bg-muted" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Ingredientes</Label>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-success">
                      <Check className="h-3 w-3 mr-1" />
                      {matchedCount} encontrados
                    </Badge>
                    {unmatchedCount > 0 && (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        {unmatchedCount} não cadastrados
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {extractedRecipe.ingredients.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
                      <p>Nenhum ingrediente foi extraído.</p>
                      <p className="text-sm">Tente com outro documento ou imagem mais clara.</p>
                    </div>
                  ) : (
                    extractedRecipe.ingredients.map((ing, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          ing.matched 
                            ? 'border-success/30 bg-success/10' 
                            : 'border-destructive/30 bg-destructive/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {ing.matched ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <span className="font-medium">{ing.name}</span>
                            {ing.matched && ing.matchedName && ing.matchedName !== ing.name && (
                              <span className="text-xs text-muted-foreground ml-2">
                                → {ing.matchedName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-muted-foreground">
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {unmatchedCount > 0 && (
                  <p className="text-sm text-warning mt-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Ingredientes não cadastrados serão ignorados. Cadastre-os no Estoque para incluí-los na precificação.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirm}>
                  {unmatchedCount > 0 ? "Salvar como Rascunho" : "Criar Receita"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

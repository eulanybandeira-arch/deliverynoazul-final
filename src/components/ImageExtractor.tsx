import { useRef, useState } from "react";
import { Camera, Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useImageExtraction, ExtractedItem } from "@/hooks/useImageExtraction";

interface ImageExtractorProps {
  extractionType: "shopping_list" | "inventory";
  onItemsExtracted: (items: ExtractedItem[]) => void;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
}

export function ImageExtractor({
  extractionType,
  onItemsExtracted,
  buttonLabel = "Escanear com Câmera",
  buttonVariant = "outline",
}: ImageExtractorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const { isExtracting, extractedItems, extractFromImage, clearExtracted } = useImageExtraction();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowDialog(true);

    // Extract items
    const items = await extractFromImage(file, extractionType);
    
    // Select all items by default
    if (items.length > 0) {
      setSelectedItems(new Set(items.map((_, i) => i)));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selected = extractedItems.filter((_, i) => selectedItems.has(i));
    onItemsExtracted(selected);
    handleClose();
  };

  const handleClose = () => {
    setShowDialog(false);
    setPreviewUrl(null);
    setSelectedItems(new Set());
    clearExtracted();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const formatUnit = (unit?: string) => {
    if (!unit) return "un";
    return unit.toLowerCase();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button variant={buttonVariant} onClick={handleCapture}>
        <Camera className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Extração por Imagem</DialogTitle>
            <DialogDescription>
              {isExtracting
                ? "Analisando imagem com IA..."
                : extractedItems.length > 0
                ? "Selecione os itens que deseja adicionar"
                : "Aguardando análise da imagem"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {previewUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
                {isExtracting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Analisando com IA...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Items */}
            {extractedItems.length > 0 && (
              <ScrollArea className="h-[200px] rounded-md border p-3">
                <div className="space-y-2">
                  {extractedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedItems.has(index)
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedItems.has(index)}
                        onCheckedChange={() => toggleItem(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.category && (
                            <Badge 
                              className={`text-xs ${
                                item.category === "insumos" ? "bg-orange-500/20 text-orange-600" :
                                item.category === "bebidas" ? "bg-purple-500/20 text-purple-600" :
                                item.category === "embalagens" ? "bg-blue-500/20 text-blue-600" :
                                item.category === "limpeza" ? "bg-green-500/20 text-green-600" : ""
                              }`}
                            >
                              {item.category}
                            </Badge>
                          )}
                          {item.quantity && (
                            <Badge variant="secondary" className="text-xs">
                              Qtd: {item.quantity} {formatUnit(item.unit)}
                            </Badge>
                          )}
                          {item.conversionFactor && item.conversionFactor > 1 && (
                            <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-600">
                              Conteúdo: {item.conversionFactor} un
                            </Badge>
                          )}
                          {item.brand && (
                            <Badge variant="outline" className="text-xs">
                              {item.brand}
                            </Badge>
                          )}
                          {item.price && item.price > 0 && (
                            <Badge variant="outline" className="text-xs">
                              R$ {item.price.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* No items found */}
            {!isExtracting && extractedItems.length === 0 && previewUrl && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Upload className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum item encontrado. Tente com uma foto mais clara.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            {extractedItems.length > 0 && (
              <Button
                onClick={handleConfirm}
                disabled={selectedItems.size === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Adicionar {selectedItems.size} Item(s)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

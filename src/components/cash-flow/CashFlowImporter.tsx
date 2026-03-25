import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { CashFlowEntry } from "@/types/cashflow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CashFlowImporterProps {
  onImport: (entries: Omit<CashFlowEntry, 'id'>[]) => void;
}

export function CashFlowImporter({ onImport }: CashFlowImporterProps) {
  const [parsedEntries, setParsedEntries] = useState<Omit<CashFlowEntry, 'id'>[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const entries: Omit<CashFlowEntry, 'id'>[] = [];
        json.forEach(row => {
          const orderId = row['ID do Pedido'];
          const grossValue = parseFloat(row['Valor Bruto do Pedido']);
          const commission = parseFloat(row['Comissão iFood']);
          const orderDate = new Date((row['Data do Pedido'] - (25567 + 2)) * 86400 * 1000); // Excel date to JS date

          if (orderId && !isNaN(grossValue) && !isNaN(commission) && orderDate) {
            // Entrada da Venda
            entries.push({
              date: orderDate.toISOString(),
              description: `Venda iFood - Pedido ${orderId}`,
              value: grossValue,
              type: 'entrada',
              category: 'venda',
              status: 'efetuado',
              location: 'conta_corrente',
              import_id: `ifood_${orderId}_venda`,
            });

            // Saída da Comissão
            if (commission > 0) {
              entries.push({
                date: orderDate.toISOString(),
                description: `Comissão iFood - Pedido ${orderId}`,
                value: commission,
                type: 'saída',
                category: 'comissao_plataforma',
                status: 'efetuado',
                location: 'conta_corrente',
                import_id: `ifood_${orderId}_comissao`,
              });
            }
          }
        });

        if (entries.length > 0) {
          setParsedEntries(entries);
          setIsDialogOpen(true);
        } else {
          toast.error("Nenhum lançamento válido encontrado no arquivo.", {
            description: "Verifique se o arquivo é um relatório de vendas do iFood e contém as colunas esperadas.",
          });
        }
      } catch (error) {
        toast.error("Erro ao processar o arquivo.", {
          description: "Certifique-se de que é um arquivo .xlsx válido.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    onImport(parsedEntries);
    setIsDialogOpen(false);
    setParsedEntries([]);
  };

  return (
    <>
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Importar Relatório iFood
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
        className="hidden"
      />
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Encontramos {Math.round(parsedEntries.length / 2)} pedidos ({parsedEntries.length} lançamentos entre vendas e comissões). Deseja adicioná-los ao seu fluxo de caixa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setParsedEntries([])}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Importar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
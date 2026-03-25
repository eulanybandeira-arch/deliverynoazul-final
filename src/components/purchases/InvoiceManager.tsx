import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2, FileText, Trash2, CalendarIcon } from "lucide-react";
import { PurchaseInvoice } from "@/types/invoice";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvoiceManagerProps {
  invoices: PurchaseInvoice[];
  onInvoicesChange: (invoices: PurchaseInvoice[]) => void;
}

export function InvoiceManager({ invoices, onInvoicesChange }: InvoiceManagerProps) {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddInvoice = async () => {
    if (!description || !date || !file) {
      toast.error("Preencha a descrição, data e selecione um arquivo.");
      return;
    }
    setIsUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `invoice_${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error } = await supabase.storage.from('invoices').upload(filePath, file);
    if (error) {
      toast.error("Falha no upload.", { description: "Verifique o bucket 'invoices' e suas permissões." });
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('invoices').getPublicUrl(filePath);
    if (data.publicUrl) {
      const newInvoice: PurchaseInvoice = {
        id: Date.now().toString(),
        description,
        date: date.toISOString(),
        file_url: data.publicUrl,
        created_at: new Date().toISOString(),
      };
      onInvoicesChange([newInvoice, ...invoices]);
      toast.success("Nota fiscal adicionada com sucesso!");
      setDescription("");
      setDate(new Date());
      setFile(null);
    } else {
      toast.error("Não foi possível obter a URL do anexo.");
    }
    setIsUploading(false);
  };

  const handleRemoveInvoice = (id: string) => {
    onInvoicesChange(invoices.filter(inv => inv.id !== id));
    toast.success("Nota fiscal removida.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Notas Fiscais</CardTitle>
        <CardDescription>Cadastre suas notas aqui para associá-las às suas compras.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Input
            placeholder="Descrição (Ex: Compra Atacadão)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {file ? file.name : "Selecionar Arquivo"}
              <input type="file" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} disabled={isUploading} />
            </label>
          </Button>
          <Button onClick={handleAddInvoice} disabled={isUploading}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nota
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {invoices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhuma nota fiscal cadastrada.</p>
          ) : (
            invoices.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <a href={invoice.file_url || invoice.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <FileText className="h-4 w-4" />
                    <span>{format(parseISO(invoice.date), "dd/MM/yy")} - {invoice.description}</span>
                  </a>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveInvoice(invoice.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
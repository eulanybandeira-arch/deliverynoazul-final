import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EquipmentItem } from "@/types/equipment";
import { Plus, Save, X, CalendarIcon, Upload, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentFormProps {
  onSubmit: (item: Omit<EquipmentItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  editingItem: EquipmentItem | null;
  onCancelEdit: () => void;
}

const initialFormData = {
  name: "",
  purchase_value: "",
  current_value: "",
  purchase_date: "",
  status: "ativo",
  invoice_url: "",
  photo_url: "",
};

export function EquipmentForm({ onSubmit, editingItem, onCancelEdit }: EquipmentFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        purchase_value: String(editingItem.purchase_value),
        current_value: String(editingItem.current_value || editingItem.purchase_value),
        purchase_date: editingItem.purchase_date ? format(new Date(editingItem.purchase_date.replace(/-/g, '\/')), 'yyyy-MM-dd') : "",
        status: editingItem.status || "ativo",
        invoice_url: editingItem.invoice_url || "",
        photo_url: editingItem.photo_url || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingItem]);

  const handleFileUpload = async (file: File, type: 'invoice' | 'photo') => {
    if (!file) return;
    const setLoading = type === 'invoice' ? setIsUploadingInvoice : setIsUploadingPhoto;
    setLoading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error } = await supabase.storage.from('equipment').upload(filePath, file);

    if (error) {
      toast.error("Falha no upload.", { description: "Verifique o bucket 'equipment' e suas permissões." });
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from('equipment').getPublicUrl(filePath);

    if (data.publicUrl) {
      const fieldToUpdate = type === 'invoice' ? 'invoice_url' : 'photo_url';
      setFormData(prev => ({ ...prev, [fieldToUpdate]: data.publicUrl }));
      toast.success("Anexo enviado com sucesso!");
    } else {
      toast.error("Não foi possível obter a URL do anexo.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purchaseValue = parseFloat(formData.purchase_value) || 0;
    onSubmit({
      name: formData.name,
      purchase_value: purchaseValue,
      current_value: parseFloat(formData.current_value) || purchaseValue,
      purchase_date: formData.purchase_date || undefined,
      status: formData.status,
      invoice_url: formData.invoice_url || undefined,
      photo_url: formData.photo_url || undefined,
    });
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{editingItem ? "Editar Equipamento" : "Cadastrar Equipamento"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Equipamento <span className="text-destructive">*</span></Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_value">Valor de Compra (R$) <span className="text-destructive">*</span></Label>
              <Input id="purchase_value" type="number" step="0.01" value={formData.purchase_value} onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">Data da Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchase_date ? format(new Date(formData.purchase_date.replace(/-/g, '\/')), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date ? new Date(formData.purchase_date.replace(/-/g, '\/')) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, purchase_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Anexo de Nota Fiscal</Label>
              {formData.invoice_url ? (
                <Button variant="outline" asChild className="w-full">
                  <a href={formData.invoice_url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4 mr-2" /> Ver Nota</a>
                </Button>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <label className="cursor-pointer flex items-center justify-center">
                    {isUploadingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploadingInvoice ? "Enviando..." : "Carregar Nota"}
                    <input type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'invoice')} disabled={isUploadingInvoice} />
                  </label>
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Anexo de Foto do Equipamento</Label>
              {formData.photo_url ? (
                <Button variant="outline" asChild className="w-full">
                  <a href={formData.photo_url} target="_blank" rel="noopener noreferrer"><ImageIcon className="h-4 w-4 mr-2" /> Ver Foto</a>
                </Button>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <label className="cursor-pointer flex items-center justify-center">
                    {isUploadingPhoto ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploadingPhoto ? "Enviando..." : "Carregar Foto"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'photo')} disabled={isUploadingPhoto} />
                  </label>
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="w-full">
              {editingItem ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingItem ? "Salvar Alterações" : "Adicionar Equipamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

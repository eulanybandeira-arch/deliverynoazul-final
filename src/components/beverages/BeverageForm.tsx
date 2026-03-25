import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeverageItem } from "@/types/beverage";
import { Plus, Save, X, CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/pricing";

interface BeverageFormProps {
  onSubmit: (item: Omit<BeverageItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_stock'>) => void;
  editingItem: BeverageItem | null;
  onCancelEdit: () => void;
}

const initialFormData = {
  name: "",
  brand: "",
  purchase_unit: "unidade",
  quantity_purchased: "",
  unit_cost: "",
  min_alert_level: "",
  expiry_date: "",
};

export function BeverageForm({ onSubmit, editingItem, onCancelEdit }: BeverageFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        brand: editingItem.brand || "",
        purchase_unit: editingItem.purchase_unit || "unidade",
        quantity_purchased: String(editingItem.quantity_purchased),
        unit_cost: String(editingItem.unit_cost),
        min_alert_level: String(editingItem.min_alert_level),
        expiry_date: editingItem.expiry_date ? format(new Date(editingItem.expiry_date.replace(/-/g, '\/')), 'yyyy-MM-dd') : "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingItem]);

  useEffect(() => {
    const qty = parseFloat(formData.quantity_purchased) || 0;
    const cost = parseFloat(formData.unit_cost) || 0;
    setTotalCost(qty * cost);
  }, [formData.quantity_purchased, formData.unit_cost]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      brand: formData.brand,
      purchase_unit: formData.purchase_unit,
      quantity_purchased: parseFloat(formData.quantity_purchased),
      unit_cost: parseFloat(formData.unit_cost),
      total_cost: totalCost,
      min_alert_level: parseFloat(formData.min_alert_level),
      expiry_date: formData.expiry_date || undefined,
    });
    if (!editingItem) {
      setFormData(initialFormData);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{editingItem ? "Editar Bebida" : "Cadastrar Bebida"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Item <span className="text-destructive">*</span></Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_purchased">Qtd. Comprada <span className="text-destructive">*</span></Label>
              <Input id="quantity_purchased" type="number" value={formData.quantity_purchased} onChange={(e) => setFormData({ ...formData, quantity_purchased: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_unit">Unidade de Compra</Label>
              <Select value={formData.purchase_unit} onValueChange={(value) => setFormData({ ...formData, purchase_unit: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="fardo">Fardo</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Custo por Unidade (R$) <span className="text-destructive">*</span></Label>
              <Input id="unit_cost" type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} required />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Custo Total do Lote</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {formatCurrency(totalCost)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_alert_level">Nível Mínimo <span className="text-destructive">*</span></Label>
              <Input id="min_alert_level" type="number" value={formData.min_alert_level} onChange={(e) => setFormData({ ...formData, min_alert_level: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Validade (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiry_date ? format(new Date(formData.expiry_date.replace(/-/g, '\/')), "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiry_date ? new Date(formData.expiry_date.replace(/-/g, '\/')) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, expiry_date: format(date, 'yyyy-MM-dd') })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="w-full">
              {editingItem ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingItem ? "Salvar Alterações" : "Adicionar Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CleaningItem } from "@/types/cleaning";
import { Plus, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/pricing";

interface CleaningFormProps {
  onSubmit: (item: Omit<CleaningItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_stock'>) => void;
  editingItem: CleaningItem | null;
  onCancelEdit: () => void;
}

const initialFormData = {
  name: "",
  brand: "",
  purchase_unit: "unidade",
  quantity_purchased: "",
  unit_cost: "",
  min_alert_level: "",
};

export function CleaningForm({ onSubmit, editingItem, onCancelEdit }: CleaningFormProps) {
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
    });
    if (!editingItem) {
      setFormData(initialFormData);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{editingItem ? "Editar Produto de Limpeza" : "Cadastrar Produto de Limpeza"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto <span className="text-destructive">*</span></Label>
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
                  <SelectItem value="galao">Galão</SelectItem>
                  <SelectItem value="litro">Litro</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Custo por Unidade (R$) <span className="text-destructive">*</span></Label>
              <Input id="unit_cost" type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="w-full">
              {editingItem ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingItem ? "Salvar Alterações" : "Adicionar Produto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

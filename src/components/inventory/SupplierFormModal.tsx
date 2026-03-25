import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Supplier, SUPPLIER_CATEGORIES } from "@/types/supplier";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (supplier: Partial<Supplier>) => void;
  editingSupplier: Supplier | null;
}

export function SupplierFormModal({ open, onOpenChange, onSave, editingSupplier }: Props) {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    category: "Outros",
    contact: "",
    defaultLeadTime: 1,
    notes: "",
  });

  useEffect(() => {
    if (editingSupplier) {
      setFormData(editingSupplier);
    } else {
      setFormData({
        name: "",
        category: "Outros",
        contact: "",
        defaultLeadTime: 1,
        notes: "",
      });
    }
  }, [editingSupplier, open]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Cadastre os parceiros de abastecimento do restaurante.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input 
              id="name" 
              placeholder="Ex: Atacadão Costa" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v: any) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contato / WhatsApp</Label>
              <Input 
                id="contact" 
                placeholder="(00) 00000-0000" 
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadTime">Prazo Padrão de Entrega (Dias)</Label>
            <Input 
              id="leadTime" 
              type="number"
              min="0"
              value={formData.defaultLeadTime}
              onChange={(e) => setFormData({ ...formData, defaultLeadTime: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea 
              id="notes" 
              placeholder="Ex: Entrega apenas terças e quintas." 
              className="h-24 resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Fornecedor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
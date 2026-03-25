import { useState } from "react";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { useEquipment } from "@/hooks/useEquipment";
import { EquipmentItem } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Equipamentos() {
  const { items, loading, addItem, updateItem, deleteItem } = useEquipment();
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (item: EquipmentItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (itemData: Omit<EquipmentItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      const result = await updateItem(editingItem.id, itemData);
      if (result) {
        toast.success("Equipamento atualizado com sucesso!");
        handleCancelEdit();
      }
    } else {
      const result = await addItem(itemData);
      if (result) {
        toast.success("Equipamento cadastrado com sucesso!");
        handleCancelEdit();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteItem(id);
    if (success) {
      toast.success("Equipamento excluído.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">Inventário de Equipamentos</h1>
        {!isFormOpen && (
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Equipamento
          </Button>
        )}
      </div>

      {isFormOpen && (
        <EquipmentForm
          onSubmit={handleSubmit}
          editingItem={editingItem}
          onCancelEdit={handleCancelEdit}
        />
      )}

      <EquipmentTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}

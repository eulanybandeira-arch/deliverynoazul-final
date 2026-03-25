import { useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Search, Edit, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SupplierFormModal } from "@/components/inventory/SupplierFormModal";
import { Supplier } from "@/types/supplier";

export default function Fornecedores() {
  const { suppliers, addSupplier, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = (data: Partial<Supplier>) => {
    if (editingSupplier) {
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      addSupplier(data as Omit<Supplier, "id">);
      toast.success("Novo fornecedor cadastrado!");
    }
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Truck className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight dark:text-foreground">Fornecedores</h1>
          </div>
          <p className="text-muted-foreground">Gerencie seus parceiros de abastecimento e prazos de entrega.</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => {
            setEditingSupplier(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar fornecedor..." 
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Fornecedor / Empresa</TableHead>
              <TableHead className="font-bold">Tipo</TableHead>
              <TableHead className="font-bold text-center">Prazo Padrão</TableHead>
              <TableHead className="font-bold">Contato</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow 
                key={s.id} 
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
                onClick={() => handleEdit(s)}
              >
                <TableCell className="font-semibold group-hover:text-primary transition-colors">
                  {s.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{s.category}</Badge>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {s.defaultLeadTime} dias
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                    {s.contact}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(s); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); deleteSupplier(s.id); toast.error("Fornecedor removido."); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SupplierFormModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        editingSupplier={editingSupplier}
      />
    </div>
  );
}
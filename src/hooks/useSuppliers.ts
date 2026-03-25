import { useState } from "react";
import { Supplier } from "@/types/supplier";

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "s1", name: "Atacadão Costa", category: "Atacadão", defaultLeadTime: 2, contact: "(11) 98888-7777" },
  { id: "s2", name: "Distribuidora Silva", category: "Distribuidor", defaultLeadTime: 3, contact: "(11) 96666-5555" },
  { id: "s3", name: "Hortifruti Central", category: "Feira", defaultLeadTime: 1, contact: "(11) 94444-3333" },
  { id: "s4", name: "Frigorífico Boi de Ouro", category: "Açougue", defaultLeadTime: 2, contact: "(11) 92222-1111" },
];

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);

  const addSupplier = (data: Omit<Supplier, "id">) => {
    const newSupplier = { ...data, id: Math.random().toString(36).substr(2, 9) };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  return { suppliers, addSupplier, deleteSupplier };
}
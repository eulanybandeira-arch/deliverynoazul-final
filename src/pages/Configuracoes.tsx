import { BusinessIdentity } from "@/components/pricing/BusinessIdentity";
import { UserSettings } from "@/components/UserSettings";
import { DataMigrationCard } from "@/components/DataMigrationCard";
import { useState } from "react";
import { BusinessIdentity as BusinessIdentityType } from "@/types/pricing";

const initialIdentity: BusinessIdentityType = {
  type: 'cnpj',
  razaoSocial: '',
  nomeCompleto: '',
  documento: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  dadosConfirmados: false,
};

export default function Configuracoes() {
  const [businessIdentity, setBusinessIdentity] = useState<BusinessIdentityType>(initialIdentity);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-primary dark:text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Configure as informações do seu estabelecimento para personalizar relatórios e exportações.
        </p>
      </header>

      <UserSettings />

      <DataMigrationCard />

      <BusinessIdentity 
        identity={businessIdentity}
        onUpdate={setBusinessIdentity}
      />
    </div>
  );
}
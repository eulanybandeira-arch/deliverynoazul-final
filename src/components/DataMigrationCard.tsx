import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataMigration } from "@/hooks/useDataMigration";
import { Database, Loader2, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";

export function DataMigrationCard() {
  const { migrateData, clearLocalStorageData, checkLocalStorageData, migrating, result } = useDataMigration();
  const [localData, setLocalData] = useState({ beverages: 0, cleaning: 0, invoices: 0, total: 0 });

  useEffect(() => {
    setLocalData(checkLocalStorageData());
  }, []);

  const handleMigrate = async () => {
    await migrateData();
    setLocalData(checkLocalStorageData());
  };

  const handleClearData = () => {
    if (confirm("Tem certeza que deseja remover os dados antigos do localStorage? Esta ação não pode ser desfeita.")) {
      clearLocalStorageData();
      setLocalData(checkLocalStorageData());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Migração de Dados
        </CardTitle>
        <CardDescription>
          Migre dados antigos do navegador para o banco de dados na nuvem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {localData.total > 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dados encontrados no localStorage</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Bebidas: {localData.beverages} itens</li>
                <li>• Produtos de limpeza: {localData.cleaning} itens</li>
                <li>• Notas fiscais: {localData.invoices} itens</li>
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Nenhum dado pendente</AlertTitle>
            <AlertDescription>
              Não há dados no localStorage para migrar.
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-primary/50 bg-primary/10">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle>Resultado da migração</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Bebidas: {result.beverages.migrated} migrados, {result.beverages.skipped} ignorados</li>
                <li>• Produtos de limpeza: {result.cleaning.migrated} migrados, {result.cleaning.skipped} ignorados</li>
                <li>• Notas fiscais: {result.invoices.migrated} migrados, {result.invoices.skipped} ignorados</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleMigrate} 
            disabled={migrating || localData.total === 0}
            className="flex-1"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Migrar Dados
              </>
            )}
          </Button>
          
          {localData.total > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleClearData}
              disabled={migrating}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          A migração copia os dados do localStorage do seu navegador para o banco de dados na nuvem.
          Após migrar, você pode remover os dados antigos com segurança.
        </p>
      </CardContent>
    </Card>
  );
}

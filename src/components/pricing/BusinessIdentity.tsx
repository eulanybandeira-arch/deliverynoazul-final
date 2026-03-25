import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, AlertTriangle, Lock, Save } from "lucide-react";
import { BusinessIdentity as BusinessIdentityType } from "@/types/pricing";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BusinessIdentityProps {
  identity: BusinessIdentityType;
  onUpdate: (identity: BusinessIdentityType) => void;
}

export function BusinessIdentity({ identity, onUpdate }: BusinessIdentityProps) {
  const { user } = useAuth();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  // Carrega dados do Supabase ao montar
  useEffect(() => {
    if (!user) return;
    
    const fetchIdentity = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('business_identity')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingRecordId(data.id);
          onUpdate({
            id: data.id,
            type: (data.type as 'cnpj' | 'cpf' | 'estrangeiro') || 'cnpj',
            razaoSocial: data.razao_social || '',
            nomeCompleto: data.nome_completo || '',
            documento: data.documento || '',
            email: data.email || '',
            telefone: data.telefone || '',
            cep: data.cep || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.cidade || '',
            estado: data.estado || '',
            dadosConfirmados: data.dados_confirmados || false,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdentity();
  }, [user]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");
    onUpdate({ ...identity, cep });

    if (cep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
          toast.error("CEP não encontrado.");
        } else {
          onUpdate({
            ...identity,
            cep,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          });
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP.");
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const getDocumentLabel = () => {
    switch (identity.type) {
      case 'cnpj': return 'CNPJ';
      case 'cpf': return 'CPF';
      case 'estrangeiro': return 'Passaporte';
      default: return 'Documento';
    }
  };

  const handleSaveClick = () => {
    // Se dados já estão confirmados ou já existe registro com dados confirmados, salva direto
    if (identity.dadosConfirmados || existingRecordId) {
      saveToDatabase(false);
    } else {
      // Primeira vez salvando - mostra modal de confirmação
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    saveToDatabase(true); // Marca dados como confirmados
  };

  const saveToDatabase = async (confirmData: boolean) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: identity.razaoSocial || identity.nomeCompleto || 'Sem nome',
        type: identity.type,
        documento: identity.documento,
        razao_social: identity.razaoSocial,
        nome_completo: identity.nomeCompleto,
        email: identity.email,
        telefone: identity.telefone,
        cep: identity.cep,
        logradouro: identity.logradouro,
        numero: identity.numero,
        complemento: identity.complemento,
        bairro: identity.bairro,
        cidade: identity.cidade,
        estado: identity.estado,
        dados_confirmados: confirmData ? true : identity.dadosConfirmados,
      };

      let error;

      if (existingRecordId) {
        // Update existente
        const result = await supabase
          .from('business_identity')
          .update(payload)
          .eq('id', existingRecordId);
        error = result.error;
      } else {
        // Insert novo
        const result = await supabase
          .from('business_identity')
          .insert(payload)
          .select()
          .single();
        error = result.error;
        if (result.data) {
          setExistingRecordId(result.data.id);
        }
      }

      if (error) {
        // Verifica se é erro do trigger de bloqueio
        if (error.message.includes('não pode ser alterado')) {
          toast.error(error.message);
        } else {
          throw error;
        }
        return;
      }

      if (confirmData) {
        onUpdate({ ...identity, dadosConfirmados: true });
      }

      toast.success("Dados salvos com sucesso!");
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error("Erro ao salvar dados");
    } finally {
      setIsSaving(false);
    }
  };

  const isLegalDataLocked = identity.dadosConfirmados === true;

  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando dados...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Dados de Cadastro
          </CardTitle>
          <CardDescription>Informações do seu negócio para personalizar relatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aviso sobre dados não editáveis */}
          {!isLegalDataLocked && (
            <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Atenção: Dados Permanentes</AlertTitle>
              <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
                Os dados de identificação legal (CPF/CNPJ/Passaporte) são <strong>permanentes</strong>. 
                Após salvar pela primeira vez, não poderão ser alterados. Para correções, 
                será necessário um novo registro no sistema.
              </AlertDescription>
            </Alert>
          )}

          {isLegalDataLocked && (
            <Alert className="border-primary/50 bg-primary/5">
              <Lock className="h-4 w-4 text-primary" />
              <AlertTitle>Dados Legais Confirmados</AlertTitle>
              <AlertDescription>
                Os campos de identificação legal estão bloqueados para edição. 
                Você pode alterar apenas informações de contato e endereço.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo <span className="text-destructive">*</span>
                {isLegalDataLocked && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
              </Label>
              <Select
                value={identity.type}
                onValueChange={(value: 'cnpj' | 'cpf' | 'estrangeiro') => onUpdate({ ...identity, type: value })}
                disabled={isLegalDataLocked}
              >
                <SelectTrigger id="type" className={isLegalDataLocked ? "bg-muted" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnpj">Pessoa Jurídica (CNPJ)</SelectItem>
                  <SelectItem value="cpf">Pessoa Física (CPF)</SelectItem>
                  <SelectItem value="estrangeiro">Estrangeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {identity.type === 'cnpj' ? (
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">
                  Razão Social <span className="text-destructive">*</span>
                  {isLegalDataLocked && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                </Label>
                <Input
                  id="razaoSocial"
                  value={identity.razaoSocial || ''}
                  onChange={(e) => onUpdate({ ...identity, razaoSocial: e.target.value })}
                  disabled={isLegalDataLocked}
                  className={isLegalDataLocked ? "bg-muted" : ""}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">
                  Nome Completo <span className="text-destructive">*</span>
                  {isLegalDataLocked && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                </Label>
                <Input
                  id="nomeCompleto"
                  value={identity.nomeCompleto || ''}
                  onChange={(e) => onUpdate({ ...identity, nomeCompleto: e.target.value })}
                  disabled={isLegalDataLocked}
                  className={isLegalDataLocked ? "bg-muted" : ""}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="documento">
                {getDocumentLabel()} <span className="text-destructive">*</span>
                {isLegalDataLocked && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
              </Label>
              <Input
                id="documento"
                value={identity.documento || ''}
                onChange={(e) => onUpdate({ ...identity, documento: e.target.value })}
                disabled={isLegalDataLocked}
                className={isLegalDataLocked ? "bg-muted" : ""}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={identity.email || ''}
                onChange={(e) => onUpdate({ ...identity, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone <span className="text-destructive">*</span></Label>
              <Input
                id="telefone"
                type="tel"
                value={identity.telefone || ''}
                onChange={(e) => onUpdate({ ...identity, telefone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Label className="font-semibold">Endereço</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP <span className="text-destructive">*</span></Label>
                <Input
                  id="cep"
                  value={identity.cep || ''}
                  onChange={handleCepChange}
                  maxLength={8}
                  disabled={isFetchingCep}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro <span className="text-destructive">*</span></Label>
                <Input
                  id="logradouro"
                  value={identity.logradouro || ''}
                  onChange={(e) => onUpdate({ ...identity, logradouro: e.target.value })}
                  disabled={isFetchingCep}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número <span className="text-destructive">*</span></Label>
                <Input
                  id="numero"
                  value={identity.numero || ''}
                  onChange={(e) => onUpdate({ ...identity, numero: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={identity.complemento || ''}
                  onChange={(e) => onUpdate({ ...identity, complemento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro <span className="text-destructive">*</span></Label>
                <Input
                  id="bairro"
                  value={identity.bairro || ''}
                  onChange={(e) => onUpdate({ ...identity, bairro: e.target.value })}
                  disabled={isFetchingCep}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade <span className="text-destructive">*</span></Label>
                <Input
                  id="cidade"
                  value={identity.cidade || ''}
                  onChange={(e) => onUpdate({ ...identity, cidade: e.target.value })}
                  disabled={isFetchingCep}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado <span className="text-destructive">*</span></Label>
                <Input
                  id="estado"
                  value={identity.estado || ''}
                  onChange={(e) => onUpdate({ ...identity, estado: e.target.value })}
                  disabled={isFetchingCep}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSaveClick} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação Final */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmação de Dados Legais
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a confirmar seus dados de identificação legal. 
                Após esta confirmação:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O <strong>Tipo de Identificação</strong> não poderá ser alterado</li>
                <li>O <strong>{getDocumentLabel()}</strong> não poderá ser alterado</li>
                <li>O <strong>{identity.type === 'cnpj' ? 'Razão Social' : 'Nome Completo'}</strong> não poderá ser alterado</li>
              </ul>
              <p className="font-medium text-foreground">
                Para correções futuras, será necessário um novo registro no sistema.
              </p>
              <p className="text-sm">
                Deseja confirmar e salvar os dados?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Confirmar e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
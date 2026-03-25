import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UserSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setIsLoading(true);
        try {
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();
          
          if (data?.display_name) {
            setDisplayName(data.display_name);
          } else {
            const defaultName = user.user_metadata?.display_name || user.email?.split('@')[0] || "";
            setDisplayName(defaultName);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Nome atualizado com sucesso!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erro ao atualizar nome");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Perfil do Usuário
        </CardTitle>
        <CardDescription>Personalize suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nome de Exibição</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Digite seu nome"
            disabled={isLoading || isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading || isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}

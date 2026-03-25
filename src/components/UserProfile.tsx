import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, KeyRound, Upload, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarCropDialog } from "./AvatarCropDialog";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";

export function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [displayName, setDisplayName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.display_name || user.email?.split('@')[0] || "Usuário";
      setDisplayName(name);

      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data) {
          if (data.display_name) setDisplayName(data.display_name);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Create preview URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const fileExt = 'jpg';
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload cropped avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Erro ao atualizar foto");
    } finally {
      setIsUploading(false);
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
        setSelectedImageUrl("");
      }
    }
  };

  const handleChangePassword = () => {
    // TODO: Implementar troca de senha
    toast.info("Funcionalidade em desenvolvimento");
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {selectedImageUrl && (
        <AvatarCropDialog
          open={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false);
            URL.revokeObjectURL(selectedImageUrl);
            setSelectedImageUrl("");
          }}
          imageUrl={selectedImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors" disabled={isUploading}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px] hidden md:block">
            {displayName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditPhoto} disabled={isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            <span>{isUploading ? "Enviando..." : "Editar foto"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleChangePassword}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Trocar senha</span>
          </DropdownMenuItem>
          {isMobile && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

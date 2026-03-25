import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, Upload, FileText, Trash2, Edit, Loader2, ShieldCheck, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Admin emails that can access this page
const ADMIN_EMAILS = ["lanyabandeira@gmail.com"];

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source_type: string;
  file_url: string | null;
  file_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminKnowledge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());
  const [extractionProgress, setExtractionProgress] = useState<Record<string, number>>({});

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Check admin access
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchItems();
    }
  }, [isAdmin]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching knowledge base:", error);
      toast.error("Erro ao carregar base de conhecimento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("knowledge_base")
        .insert({
          user_id: user!.id,
          title: title.trim(),
          content: content.trim(),
          source_type: "manual",
        });

      if (error) throw error;

      toast.success("Conhecimento adicionado com sucesso!");
      setIsAddDialogOpen(false);
      setTitle("");
      setContent("");
      fetchItems();
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast.error("Erro ao adicionar conhecimento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "text/plain", 
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use TXT, PDF, DOCX ou XLSX.");
      return;
    }

    setIsSaving(true);
    try {
      // Upload to storage
      const filePath = `admin/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("knowledge-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Read file content for text files
      let fileContent = `[Arquivo: ${file.name}] - Processando extração...`;
      if (file.type === "text/plain") {
        fileContent = await file.text();
      }

      // Save to database
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          user_id: user!.id,
          title: file.name,
          content: fileContent,
          source_type: "file",
          file_url: filePath,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Arquivo enviado!");
      fetchItems();

      // Extract text for non-text files using AI
      if (file.type !== "text/plain" && data) {
        const knowledgeId = data.id;
        setExtractingIds(prev => new Set(prev).add(knowledgeId));
        setExtractionProgress(prev => ({ ...prev, [knowledgeId]: 10 }));
        
        try {
          // Simulate progress while waiting for extraction
          const progressInterval = setInterval(() => {
            setExtractionProgress(prev => {
              const current = prev[knowledgeId] || 10;
              if (current < 90) {
                return { ...prev, [knowledgeId]: current + Math.random() * 15 };
              }
              return prev;
            });
          }, 500);

          const extractResponse = await supabase.functions.invoke("extract-document-text", {
            body: { 
              filePath, 
              fileName: file.name, 
              knowledgeId 
            }
          });

          clearInterval(progressInterval);
          setExtractionProgress(prev => ({ ...prev, [knowledgeId]: 100 }));

          if (extractResponse.error) {
            throw new Error(extractResponse.error.message);
          }

          toast.success(`Conteúdo extraído: ${extractResponse.data.extractedLength} caracteres`);
          
          // Small delay to show 100% before removing
          setTimeout(() => {
            setExtractingIds(prev => {
              const next = new Set(prev);
              next.delete(knowledgeId);
              return next;
            });
            setExtractionProgress(prev => {
              const { [knowledgeId]: _, ...rest } = prev;
              return rest;
            });
            fetchItems();
          }, 500);
        } catch (extractError) {
          console.error("Extraction error:", extractError);
          toast.error("Erro ao extrair conteúdo. Tente editar manualmente.");
          setExtractingIds(prev => {
            const next = new Set(prev);
            next.delete(knowledgeId);
            return next;
          });
          setExtractionProgress(prev => {
            const { [knowledgeId]: _, ...rest } = prev;
            return rest;
          });
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !title.trim() || !content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("knowledge_base")
        .update({ title: title.trim(), content: content.trim() })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast.success("Atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setTitle("");
      setContent("");
      fetchItems();
    } catch (error) {
      console.error("Error updating knowledge:", error);
      toast.error("Erro ao atualizar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteId) return;

    const item = items.find(i => i.id === deleteId);

    try {
      // Delete file from storage if exists
      if (item?.file_url) {
        await supabase.storage.from("knowledge-docs").remove([item.file_url]);
      }

      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Removido com sucesso!");
      setDeleteId(null);
      fetchItems();
    } catch (error) {
      console.error("Error deleting knowledge:", error);
      toast.error("Erro ao remover");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("knowledge_base")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_active: isActive } : item
      ));
      toast.success(isActive ? "Ativado" : "Desativado");
    } catch (error) {
      console.error("Error toggling:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setIsEditDialogOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary dark:text-foreground">Base de Conhecimento Admin</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie os documentos e conhecimentos que calibram o Lucra para todos os usuários
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Conhecimentos do Sistema
            </CardTitle>
            <CardDescription>
              {items.length} item(s) • {items.filter(i => i.is_active).length} ativo(s)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Texto
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Enviar Arquivo
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleUploadFile}
                  disabled={isSaving}
                />
              </label>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum conhecimento cadastrado ainda.</p>
              <p className="text-sm mt-1">Adicione textos ou arquivos para calibrar o Lucra.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.source_type === "file" ? (
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{item.title}</span>
                        <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {extractingIds.has(item.id) && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Extraindo...
                          </Badge>
                        )}
                      </div>
                      {extractingIds.has(item.id) ? (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Extraindo conteúdo com IA...</span>
                            <span>{Math.round(extractionProgress[item.id] || 0)}%</span>
                          </div>
                          <Progress value={extractionProgress[item.id] || 0} className="h-1.5" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.content.substring(0, 200)}...
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Conhecimento</DialogTitle>
            <DialogDescription>
              Adicione um texto que será usado para calibrar o Lucra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Regras de precificação"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Digite o conteúdo que o Lucra deve consultar..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conhecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditItem} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conhecimento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, Trash2, TrendingUp, AlertTriangle, HelpCircle, Paperclip, X, Image as ImageIcon, ChefHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Attachment {
  file: File;
  preview?: string;
  type: "image" | "file";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; url?: string; type: string }[];
}

interface RecipeForAnalysis {
  id: string;
  name: string;
}

interface UserContext {
  recipes: { total: number; lowMargin: any[] } | null;
  inventory: { total: number; lowStock: any[] } | null;
  cashFlow: { income: number; expenses: number; balance: number } | null;
  metrics: any | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_SUGGESTIONS = [
  { label: "Análise do Lucro", icon: TrendingUp, message: "Quero analisar meu lucro. Me ajude a escolher o período: posso ver por dia específico, semana, quinzena ou mês?" },
  { label: "Alertas de Preço de Insumos", icon: AlertTriangle, message: "Quais insumos estão com preço alto ou estoque baixo? Me alerte sobre possíveis prejuízos." },
  { label: "Como precificar corretamente?", icon: HelpCircle, message: "Me explique como devo precificar meus produtos para garantir lucro. Quais fatores devo considerar?" },
];

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recipesForAnalysis, setRecipesForAnalysis] = useState<RecipeForAnalysis[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user context and recipes on mount
  useEffect(() => {
    if (user) {
      fetchUserContext();
      fetchRecipesForAnalysis();
    }
  }, [user]);

  const fetchRecipesForAnalysis = async () => {
    const { data } = await supabase
      .from("recipes")
      .select("id, name")
      .order("name");
    setRecipesForAnalysis(data || []);
  };

  const fetchUserContext = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [recipesRes, inventoryRes, cashFlowRes, metricsRes] = await Promise.all([
        supabase.from("recipes").select("id, name, profit_margin").order("profit_margin", { ascending: true }),
        supabase.from("inventory_items").select("id, name, current_stock, min_alert_level"),
        supabase.from("cash_flow_entries").select("type, value").gte("date", startOfMonth).lte("date", endOfMonth),
        supabase.from("business_metrics").select("*").maybeSingle(),
      ]);

      const recipes = recipesRes.data || [];
      const inventory = inventoryRes.data || [];
      const cashFlow = cashFlowRes.data || [];

      const income = cashFlow.filter(e => e.type === "entrada").reduce((sum, e) => sum + Number(e.value), 0);
      const expenses = cashFlow.filter(e => e.type === "saida").reduce((sum, e) => sum + Number(e.value), 0);

      setUserContext({
        recipes: {
          total: recipes.length,
          lowMargin: recipes.filter(r => r.profit_margin && r.profit_margin < 30).slice(0, 5),
        },
        inventory: {
          total: inventory.length,
          lowStock: inventory.filter(i => i.current_stock <= i.min_alert_level).slice(0, 5),
        },
        cashFlow: {
          income,
          expenses,
          balance: income - expenses,
        },
        metrics: metricsRes.data,
      });
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const [, linkText, linkPath] = match;
      const isInternalLink = linkPath.startsWith("/");

      if (isInternalLink) {
        parts.push(
          <button
            key={match.index}
            onClick={() => navigate(linkPath)}
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            {linkText}
          </button>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={linkPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 font-medium"
          >
            {linkText}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.map((part, index) => {
      if (typeof part === "string") {
        const boldParts = part.split(/\*\*([^*]+)\*\*/g);
        return (
          <span key={index}>
            {boldParts.map((bp, i) => (i % 2 === 1 ? <strong key={i}>{bp}</strong> : bp))}
          </span>
        );
      }
      return part;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} muito grande (máx 5MB)`);
        continue;
      }
      
      const isImage = file.type.startsWith("image/");
      const attachment: Attachment = {
        file,
        type: isImage ? "image" : "file",
      };
      
      if (isImage) {
        attachment.preview = URL.createObjectURL(file);
      }
      
      newAttachments.push(attachment);
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const att = prev[index];
      if (att.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAttachments = async (): Promise<{ name: string; url?: string; type: string }[]> => {
    const uploaded: { name: string; url?: string; type: string }[] = [];
    
    for (const att of attachments) {
      try {
        const filePath = `${user!.id}/${Date.now()}-${att.file.name}`;
        const { error } = await supabase.storage
          .from("knowledge-docs")
          .upload(filePath, att.file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from("knowledge-docs")
          .getPublicUrl(filePath);
        
        uploaded.push({
          name: att.file.name,
          url: urlData.publicUrl,
          type: att.type,
        });
      } catch (error) {
        console.error("Upload error:", error);
        uploaded.push({
          name: att.file.name,
          type: att.type,
        });
      }
    }
    
    return uploaded;
  };

  const streamChat = async (userMessage: string, messageAttachments?: { name: string; url?: string; type: string }[], analyzeRecipeId?: string) => {
    const userMsg: Message = { 
      role: "user", 
      content: userMessage,
      attachments: messageAttachments,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          userContext,
          analyzeRecipeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Resposta sem corpo");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.role === "assistant") {
                  newMessages[lastIndex] = { role: "assistant", content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex]?.role === "assistant") {
                  newMessages[lastIndex] = { role: "assistant", content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const message = input.trim() || "Veja o anexo";
    setInput("");
    
    let uploadedAttachments: { name: string; url?: string; type: string }[] = [];
    if (attachments.length > 0) {
      uploadedAttachments = await uploadAttachments();
      // Clean up previews
      attachments.forEach(att => {
        if (att.preview) URL.revokeObjectURL(att.preview);
      });
      setAttachments([]);
    }
    
    streamChat(message, uploadedAttachments.length > 0 ? uploadedAttachments : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickSuggestion = (message: string) => {
    if (isLoading) return;
    streamChat(message);
  };


  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você precisa estar logado para usar o chat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-foreground">Lucra</h1>
          <p className="text-muted-foreground">Consultor de Inteligência do Sistema Delivery no Azul</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_SUGGESTIONS.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSuggestion(suggestion.message)}
            disabled={isLoading}
            className="gap-2"
          >
            <suggestion.icon className="h-4 w-4" />
            {suggestion.label}
          </Button>
        ))}
      </div>

      {/* Recipe Analysis - Inline Select */}
      {recipesForAnalysis.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={selectedRecipeId} 
            onValueChange={(value) => {
              setSelectedRecipeId(value);
              const recipe = recipesForAnalysis.find(r => r.id === value);
              if (recipe) {
                const message = `Analise detalhadamente a receita "${recipe.name}" com todos os custos, margens e sugestões de melhoria.`;
                streamChat(message, undefined, value);
                setSelectedRecipeId("");
              }
            }}
          >
            <SelectTrigger className="w-auto gap-2 border-dashed">
              <ChefHat className="h-4 w-4" />
              <SelectValue placeholder="Analisar uma receita..." />
            </SelectTrigger>
            <SelectContent>
              {recipesForAnalysis.map((recipe) => (
                <SelectItem key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card className="h-[calc(100vh-340px)] min-h-[400px] flex flex-col">
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Seu Sócio Financeiro de Bolso
          </CardTitle>
        </CardHeader>

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">Olá! Sou a Lucra, sua consultora financeira.</p>
              <p className="text-sm mt-2 max-w-md">
                Estou aqui para te ajudar a aumentar seu <strong>Lucro Real</strong> e blindar sua margem. Use os atalhos acima ou me pergunte qualquer coisa sobre seu negócio.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "max-w-[80%] bg-primary text-primary-foreground"
                        : "max-w-[90%] md:max-w-[85%] bg-muted"
                    }`}
                  >
                    {/* Show attachments if any */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.attachments.map((att, attIndex) => (
                          <div key={attIndex} className="flex items-center gap-1 text-xs bg-background/20 rounded px-2 py-1">
                            {att.type === "image" ? (
                              <ImageIcon className="h-3 w-3" />
                            ) : (
                              <Paperclip className="h-3 w-3" />
                            )}
                            <span className="truncate max-w-[100px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`whitespace-pre-wrap ${msg.role === "assistant" ? "text-base leading-relaxed" : "text-sm"}`}>
                      {msg.role === "assistant" ? renderMessageContent(msg.content || "...") : msg.content || "..."}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm text-muted-foreground">Analisando...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <CardContent className="border-t p-4">
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, index) => (
                <div 
                  key={index} 
                  className="relative group bg-muted rounded-lg overflow-hidden"
                >
                  {att.type === "image" && att.preview ? (
                    <img src={att.preview} alt={att.file.name} className="h-16 w-16 object-cover" />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center">
                      <Paperclip className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">
                    {att.file.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.doc,.docx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre seu negócio..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading} size="icon" className="h-11 w-11">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

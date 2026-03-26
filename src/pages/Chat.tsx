import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Bot, User, Loader2, Trash2, Paperclip, X, 
  Image as ImageIcon, Plus, MessageSquare, Clock,
  TrendingUp, AlertTriangle, HelpCircle, BarChart3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  date: string;
}

interface UserContext {
  recipes: { total: number; lowMargin: any[] } | null;
  inventory: { total: number; lowStock: any[] } | null;
  cashFlow: { income: number; expenses: number; balance: number } | null;
  metrics: any | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTED_PROMPTS = [
  { label: "↗ Análise do Lucro", message: "Quero fazer uma análise detalhada do meu lucro real este mês. O que os dados dizem?" },
  { label: "⚠ Alertas de Preço de Insumos", message: "Quais insumos tiveram maior variação de preço recentemente e como isso afeta minha margem?" },
  { label: "❓ Como precificar corretamente?", message: "Me ensine a metodologia correta para precificar meus pratos e garantir que não estou pagando para trabalhar." },
  { label: "📈 Como descobrir meu CMV Real", message: "Como eu calculo meu CMV Real (Estoque Inicial + Compras - Estoque Final) usando o sistema?" },
];

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState<ChatSession[]>([
    { id: "1", title: "Análise de CMV Hambúrguer", messages: [], date: new Date().toISOString() },
    { id: "2", title: "Dúvida sobre Taxas iFood", messages: [], date: new Date(Date.now() - 86400000).toISOString() },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>("1");
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = useMemo(() => 
    chats.find(c => c.id === activeChatId) || chats[0], 
  [chats, activeChatId]);

  const messages = activeChat?.messages || [];

  const userName = useMemo(() => {
    if (!user) return "";
    return user.user_metadata?.display_name?.split(" ")[0] || user.email?.split("@")[0] || "Usuário";
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserContext();
    }
  }, [user]);

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

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    const newChat: ChatSession = {
      id: newId,
      title: "Nova Conversa",
      messages: [],
      date: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (activeChatId === id && updated.length > 0) {
      setActiveChatId(updated[0].id);
    } else if (updated.length === 0) {
      handleNewChat();
    }
  };

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
    
    setChats(prev => prev.map(c => 
      c.id === activeChatId 
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? userMessage.substring(0, 30) + "..." : c.title } 
        : c
    ));
    
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

      setChats(prev => prev.map(c => 
        c.id === activeChatId 
          ? { ...c, messages: [...c.messages, { role: "assistant", content: "" }] } 
          : c
      ));

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
              setChats(prev => prev.map(c => {
                if (c.id === activeChatId) {
                  const newMsgs = [...c.messages];
                  newMsgs[newMsgs.length - 1] = { role: "assistant", content: assistantContent };
                  return { ...c, messages: newMsgs };
                }
                return c;
              }));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você precisa estar logado para usar o chat.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col -m-4 md:-m-8">
      <div className="flex-1 flex overflow-hidden">
        {/* COLUNA ESQUERDA: HISTÓRICO */}
        <div className="w-[280px] border-r bg-muted/10 flex flex-col shrink-0">
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewChat} 
              className="w-full gap-2 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Nova Conversa
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-6">
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">Hoje</p>
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                      activeChatId === chat.id 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className={cn("h-4 w-4 shrink-0", activeChatId === chat.id ? "text-primary" : "text-muted-foreground/50")} />
                    <span className="text-sm truncate pr-6">{chat.title}</span>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              <Clock className="h-3 w-3" /> Histórico de 30 dias
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CHAT ATIVO */}
        <div className="flex-1 flex flex-col bg-background relative">
          {/* Área de Mensagens */}
          <ScrollArea className="flex-1 p-4 md:p-8" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 max-w-3xl mx-auto pt-12">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Sua gestão no automático. Seu negócio noazul
                </p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary">
                  Olá, {userName}
                </h1>
                <p className="text-muted-foreground text-lg font-light leading-relaxed mb-6">
                  Me pergunte qualquer coisa sobre seu negócio.
                </p>
                <p className="text-xl text-foreground mb-8">
                  Por onde começamos?
                </p>
                
                {/* Atalhos Sugeridos (Estilo Gemini) */}
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => streamChat(prompt.message)}
                      className="px-4 py-2 rounded-full border border-border/50 bg-background/50 text-sm text-muted-foreground hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200 shadow-sm"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm",
                      msg.role === "user" ? "bg-primary" : "bg-muted border"
                    )}>
                      {msg.role === "user" ? <User className="h-5 w-5 text-primary-foreground" /> : <Bot className="h-5 w-5 text-primary" />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col space-y-2 max-w-[80%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att, attIndex) => (
                            <div key={attIndex} className="flex items-center gap-2 text-[10px] font-bold uppercase bg-muted/50 border rounded-xl px-3 py-1.5">
                              {att.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
                              <span className="truncate max-w-[150px]">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={cn(
                        "rounded-[24px] px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted/50 border border-border/40 rounded-tl-none"
                      )}>
                        {msg.role === "assistant" ? renderMessageContent(msg.content || "...") : msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="flex-shrink-0 w-9 h-9 rounded-2xl bg-muted border flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <div className="bg-muted/30 border border-dashed rounded-[24px] px-5 py-3.5 h-12 w-32" />
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input de Mensagem */}
          <div className="p-6 border-t bg-background/80 backdrop-blur-md shrink-0">
            <div className="max-w-4xl mx-auto">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative group bg-muted rounded-2xl overflow-hidden border shadow-sm">
                      {att.type === "image" && att.preview ? (
                        <img src={att.preview} alt={att.file.name} className="h-16 w-16 object-cover" />
                      ) : (
                        <div className="h-16 w-16 flex items-center justify-center bg-primary/5">
                          <Paperclip className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-muted/30 border border-border/40 rounded-[28px] p-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre seu lucro, CMV ou equipe..."
                  className="flex-1 min-h-[44px] max-h-32 border-none bg-transparent focus-visible:ring-0 resize-none py-3 text-base"
                  rows={1}
                  disabled={isLoading}
                />
                
                <Button 
                  type="submit" 
                  disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                  size="icon" 
                  className="h-11 w-11 shrink-0 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold opacity-60">
                Lucra AI • Inteligência Financeira do sistema deliverynoazul para Restaurantes e Deliveries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Bell, Package, Calendar, BarChart3, Info, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  type: "estoque_baixo" | "conta_vencer" | "analise_semanal" | "sistema";
  title: string;
  message: string;
  action_link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeConfig = {
  estoque_baixo: {
    icon: Package,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    label: "Estoque",
  },
  conta_vencer: {
    icon: Calendar,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Contas",
  },
  analise_semanal: {
    icon: BarChart3,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Análise",
  },
  sistema: {
    icon: Info,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Sistema",
  },
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_link) {
      setOpen(false);
      navigate(notification.action_link);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className={`p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
          notifications.length === 0 ? "w-48" : "w-80"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-4 px-4">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-3 px-4">
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma notificação
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-semibold text-sm">Notificações</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
                  <Check className="h-3 w-3 mr-1" />
                  Marcar todas
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="py-2">
                {Object.entries(groupedNotifications).map(([type, items], index) => {
                  const config = typeConfig[type as keyof typeof typeConfig];
                  const Icon = config.icon;

                  return (
                    <div key={type}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="px-4 py-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${config.bgColor}`}>
                            <Icon className={`h-3 w-3 ${config.color}`} />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {config.label}
                          </span>
                          <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                            {items.length}
                          </Badge>
                        </div>

                        {items.slice(0, 5).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-2 py-2 rounded-md transition-colors hover:bg-muted/50 ${
                              !notification.is_read ? "bg-muted/30" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </span>
                              {notification.action_link && (
                                <span className="text-[10px] text-primary flex items-center gap-0.5">
                                  Ver <ExternalLink className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </button>
                        ))}

                        {items.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{items.length - 5} mais
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

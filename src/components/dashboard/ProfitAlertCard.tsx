import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, ChevronRight, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";

interface ProfitAlert {
  id: string;
  title: string;
  message: string;
  action_link: string;
  created_at: string;
  is_read: boolean;
}

export function ProfitAlertCard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProfitAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "profit_alert")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error("Error fetching profit alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("profit-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as { type?: string } & ProfitAlert;
          if (newNotification && newNotification.type === "profit_alert") {
            setAlerts((prev) => [newNotification as ProfitAlert, ...prev].slice(0, 5));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", alertId);

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Lucratividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Alertas de Lucratividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum alerta de erosão de lucro.</p>
            <p className="text-xs">Suas margens estão saudáveis!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Lucratividade
          </div>
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {alert.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {alert.message}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <NavLink to={alert.action_link || "/receitas"}>
                  <Button size="sm" variant="ghost" className="h-8 px-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </NavLink>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {new Date(alert.created_at).toLocaleDateString("pt-BR")}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => markAsRead(alert.id)}
              >
                Dispensar
              </Button>
            </div>
          </div>
        ))}

        <NavLink to="/receitas" className="block">
          <Button variant="outline" size="sm" className="w-full mt-2">
            Revisar Fichas Técnicas
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </NavLink>
      </CardContent>
    </Card>
  );
}

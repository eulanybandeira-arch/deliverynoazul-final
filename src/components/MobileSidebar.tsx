import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  BookOpen,
  BarChart3,
  Calculator,
  Home,
  Landmark,
  GaugeCircle,
  FileText,
  HelpCircle,
  Archive,
  Settings,
  ShoppingCart,
  ChevronDown,
  Lock,
  Layers,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TRIAL_MESSAGE = "Funcionalidade liberada após o período de teste de 7 dias.";

export function MobileSidebar() {
  const location = useLocation();
  const { isTrial, isRouteAllowed } = useSubscription();

  const comprasSubItems = [
    { title: "Cadastro de Insumos", url: "/compras" },
    { title: "Lista de Compras", url: "/lista-compras" },
    { title: "Balanço de Estoque", url: "/balanco-estoque" },
    { title: "Relatório de Compras", url: "/relatorio-compras" },
  ];

  const mainMenuItems = [
    { title: "Precificação de Receita", url: "/receitas", icon: Calculator },
    { title: "Base de Preparo", url: "/bases-preparo", icon: Layers },
    { title: "Fichas Técnicas", url: "/receitas/biblioteca", icon: BookOpen },
    { title: "Desperdícios", url: "/desperdicios", icon: AlertTriangle },
    { title: "Despesas Fixas", url: "/analise", icon: BarChart3 },
    { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: Landmark },
    { title: "Métricas do Negócio", url: "/metricas", icon: GaugeCircle },
    { title: "Equipamentos", url: "/equipamentos", icon: Archive },
    { title: "Assistente AI", url: "/chat", icon: MessageSquare },
    { title: "Configurações", url: "/configuracoes", icon: Settings },
    { title: "FAQ", url: "/faq", icon: HelpCircle },
    { title: "Política de Uso", url: "/legal", icon: FileText },
  ];

  const isComprasActive = comprasSubItems.some((item) => location.pathname === item.url);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
    );

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(TRIAL_MESSAGE);
  };

  const comprasLocked = isTrial && !isRouteAllowed("/compras");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[280px] p-0">
        <nav className="grid gap-1 p-2">
          <a href="/dashboard" className="flex items-center gap-2 h-14 px-2 mb-2">
            <img src={`/logo.png?t=${new Date().getTime()}`} alt="Logo" className="h-6 w-6" />
            <span className="text-lg font-semibold whitespace-nowrap">
              <span className="italic bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
                delivery
              </span>
              <span className="text-primary">noazul</span>
            </span>
          </a>

          {/* Dashboard */}
          <NavLink to="/dashboard" end className={getNavCls}>
            <Home className="h-4 w-4" />
            <span className="whitespace-nowrap">Dashboard</span>
          </NavLink>

          {/* Grupo Compras */}
          {comprasLocked ? (
            <button
              onClick={handleLockedClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-60 cursor-not-allowed",
                "text-muted-foreground"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="whitespace-nowrap flex-1 text-left">Compras</span>
              <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
            </button>
          ) : (
            <Collapsible defaultOpen={isComprasActive} className="space-y-1">
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isComprasActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="whitespace-nowrap flex-1 text-left">Compras</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                {comprasSubItems.map((item) => (
                  <NavLink key={item.url} to={item.url} end className={getNavCls}>
                    <span className="whitespace-nowrap">{item.title}</span>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Restante dos itens */}
          {mainMenuItems.map((item) => {
            const locked = isTrial && !isRouteAllowed(item.url);
            if (locked) {
              return (
                <button
                  key={item.url}
                  onClick={handleLockedClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-60 cursor-not-allowed",
                    "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.title}</span>
                  <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              );
            }

            return (
              <NavLink key={item.url} to={item.url} end className={getNavCls}>
                <item.icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
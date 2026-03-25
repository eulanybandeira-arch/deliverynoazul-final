import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  BarChart3,
  Calculator,
  Layers,
  BookOpen,
  AlertTriangle,
  Landmark,
  GaugeCircle,
  Archive,
  MessageSquare,
  Settings,
  Lock,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { ScrollArea } from "@/components/ui/scroll-area";

const TRIAL_MESSAGE = "Funcionalidade liberada após o período de teste de 7 dias.";

export function MobileSidebar() {
  const { isTrial, isRouteAllowed } = useSubscription();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
    );

  const renderItem = (item: { title: string; url: string; icon: any }) => {
    const locked = isTrial && !isRouteAllowed(item.url);
    if (locked) {
      return (
        <button
          key={item.url}
          onClick={() => toast.info(TRIAL_MESSAGE)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-60 cursor-not-allowed text-muted-foreground"
        >
          <item.icon className="h-4 w-4" />
          <span className="whitespace-nowrap flex-1 text-left">{item.title}</span>
          <Lock className="h-3 w-3 ml-auto" />
        </button>
      );
    }

    return (
      <NavLink key={item.url} to={item.url} end className={getNavCls}>
        <item.icon className="h-4 w-4" />
        <span className="whitespace-nowrap">{item.title}</span>
      </NavLink>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[280px] p-0">
        <div className="flex items-center gap-2 h-14 px-4 border-b">
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
          <span className="text-lg font-semibold">
            <span className="italic bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
              delivery
            </span>
            <span className="text-primary">noazul</span>
          </span>
        </div>
        
        <ScrollArea className="flex-1">
          <nav className="grid gap-4 p-4">
            {/* Dashboard */}
            <div className="grid gap-1">
              {renderItem({ title: "Dashboard", url: "/dashboard", icon: Home })}
            </div>

            {/* ESTOQUE E COMPRAS */}
            <div className="grid gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
                Estoque e Compras
              </p>
              {renderItem({ title: "Cadastro de Insumos", url: "/compras", icon: ShoppingCart })}
              {renderItem({ title: "Fornecedores", url: "/fornecedores", icon: Truck })}
              {renderItem({ title: "Inventário & Auditoria", url: "/inventario", icon: ClipboardCheck })}
              {renderItem({ title: "Lista de Compras", url: "/lista-compras", icon: ShoppingCart })}
              {renderItem({ title: "Balanço de Estoque", url: "/balanco-estoque", icon: BarChart3 })}
            </div>

            {/* FINANCEIRO E CUSTOS */}
            <div className="grid gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
                Financeiro e Custos
              </p>
              {renderItem({ title: "Precificação de Receita", url: "/receitas", icon: Calculator })}
              {renderItem({ title: "Base de Preparo", url: "/bases-preparo", icon: Layers })}
              {renderItem({ title: "Fichas Técnicas", url: "/receitas/biblioteca", icon: BookOpen })}
              {renderItem({ title: "Desperdícios", url: "/desperdicios", icon: AlertTriangle })}
              {renderItem({ title: "Despesas Fixas", url: "/analise", icon: BarChart3 })}
              {renderItem({ title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: Landmark })}
            </div>

            {/* ESTRATÉGIA */}
            <div className="grid gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
                Estratégia
              </p>
              {renderItem({ title: "Métricas do Negócio", url: "/metricas", icon: GaugeCircle })}
              {renderItem({ title: "Equipamentos", url: "/equipamentos", icon: Archive })}
              {renderItem({ title: "Assistente AI", url: "/chat", icon: MessageSquare })}
            </div>
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          {renderItem({ title: "Configurações", url: "/configuracoes", icon: Settings })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
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
  AlertTriangle,
  MessageSquare,
  Settings,
  Lock,
  Store,
  PlusCircle
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
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors h-auto",
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
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors opacity-60 cursor-not-allowed text-muted-foreground h-auto text-left"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 leading-tight">{item.title}</span>
          <Lock className="h-3 w-3 ml-auto shrink-0" />
        </button>
      );
    }

    return (
      <NavLink key={item.url} to={item.url} end className={getNavCls}>
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="leading-tight">{item.title}</span>
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
              {renderItem({ title: "Entrada de Compras", url: "/entrada-compras", icon: PlusCircle })}
              {renderItem({ title: "Cadastro de Insumos", url: "/compras", icon: ShoppingCart })}
              {renderItem({ title: "Fornecedores", url: "/fornecedores", icon: Truck })}
              {renderItem({ title: "Inventário & Auditoria", url: "/inventario", icon: ClipboardCheck })}
              {renderItem({ title: "Lista de Compras", url: "/lista-compras", icon: ShoppingCart })}
              {renderItem({ title: "Apuração de CMV", url: "/balanco-estoque", icon: BarChart3 })}
            </div>

            {/* FINANCEIRO E CUSTOS */}
            <div className="grid gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
                Financeiro e Custos
              </p>
              {renderItem({ title: "Fichas Técnicas & Engenharia de Cardápio", url: "/receitas", icon: Calculator })}
              {renderItem({ title: "Base de Preparo", url: "/bases-preparo", icon: Layers })}
              {renderItem({ title: "Desperdícios", url: "/desperdicios", icon: AlertTriangle })}
            </div>

            {/* ESTRATÉGIA */}
            <div className="grid gap-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 mb-1">
                Estratégia
              </p>
              {renderItem({ title: "Marketplaces", url: "/marketplaces", icon: Store })}
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
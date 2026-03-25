import { 
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
  Lock 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const TRIAL_MESSAGE = "Funcionalidade liberada após o período de teste de 7 dias.";

export function AppSidebar() {
  const { isTrial, isRouteAllowed } = useSubscription();

  const renderMenuItem = (item: { title: string; url: string; icon: any }) => {
    const locked = isTrial && !isRouteAllowed(item.url);

    if (locked) {
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton 
            tooltip={item.title} 
            onClick={(e) => {
              e.preventDefault();
              toast.info(TRIAL_MESSAGE);
            }} 
            className="opacity-60 cursor-not-allowed"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild tooltip={item.title}>
          <NavLink
            to={item.url}
            end
            className={({ isActive }) =>
              cn("transition-all duration-300", isActive && "font-medium bg-accent/50")
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r sidebar-custom top-14 hidden md:flex">
      <SidebarHeader>
        <div className="flex items-center justify-end p-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Dashboard isolado no topo */}
        <SidebarGroup>
          <SidebarMenu>
            {renderMenuItem({ title: "Dashboard", url: "/dashboard", icon: Home })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ESTOQUE E COMPRAS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-2">
            Estoque e Compras
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem({ title: "Cadastro de Insumos", url: "/compras", icon: ShoppingCart })}
              {renderMenuItem({ title: "Fornecedores", url: "/fornecedores", icon: Truck })}
              {renderMenuItem({ title: "Inventário & Auditoria", url: "/inventario", icon: ClipboardCheck })}
              {renderMenuItem({ title: "Lista de Compras", url: "/lista-compras", icon: ShoppingCart })}
              {renderMenuItem({ title: "Apuração de CMV", url: "/balanco-estoque", icon: BarChart3 })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* FINANCEIRO E CUSTOS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-2">
            Financeiro e Custos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem({ title: "Fichas Técnicas & Engenharia de Cardápio", url: "/receitas", icon: Calculator })}
              {renderMenuItem({ title: "Base de Preparo", url: "/bases-preparo", icon: Layers })}
              {renderMenuItem({ title: "Fichas Técnicas", url: "/receitas/biblioteca", icon: BookOpen })}
              {renderMenuItem({ title: "Desperdícios", url: "/desperdicios", icon: AlertTriangle })}
              {renderMenuItem({ title: "Despesas Fixas", url: "/analise", icon: BarChart3 })}
              {renderMenuItem({ title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: Landmark })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ESTRATÉGIA */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-2">
            Estratégia
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem({ title: "Métricas do Negócio", url: "/metricas", icon: GaugeCircle })}
              {renderMenuItem({ title: "Equipamentos", url: "/equipamentos", icon: Archive })}
              {renderMenuItem({ title: "Assistente AI", url: "/chat", icon: MessageSquare })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/40">
        <SidebarMenu>
          {renderMenuItem({ title: "Configurações", url: "/configuracoes", icon: Settings })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
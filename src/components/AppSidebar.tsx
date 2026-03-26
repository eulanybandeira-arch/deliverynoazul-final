import { 
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
  Store
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
            <item.icon className="h-4 w-4 shrink-0" />
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
              cn(
                "flex items-center gap-2 w-full",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r top-14 hidden md:flex">
      <SidebarHeader>
        <div className="flex items-center justify-end p-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {renderMenuItem({ title: "Dashboard", url: "/dashboard", icon: Home })}
          </SidebarMenu>
        </SidebarGroup>

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

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-2">
            Financeiro e Custos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem({ title: "Fichas Técnicas & Engenharia de Cardápio", url: "/receitas", icon: Calculator })}
              {renderMenuItem({ title: "Base de Preparo", url: "/bases-preparo", icon: Layers })}
              {renderMenuItem({ title: "Desperdícios", url: "/desperdicios", icon: AlertTriangle })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-2 mb-2">
            Estratégia
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem({ title: "Marketplaces", url: "/marketplaces", icon: Store })}
              {renderMenuItem({ title: "Assistente AI", url: "/chat", icon: MessageSquare })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          {renderMenuItem({ title: "Configurações", url: "/configuracoes", icon: Settings })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
import { Package, BookOpen, BarChart3, Calculator, Home, Landmark, GaugeCircle, FileText, HelpCircle, Archive, Settings, ShoppingCart, ChevronDown, MessageSquare, Lock, Layers, AlertTriangle, Truck } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TRIAL_MESSAGE = "Funcionalidade liberada após o período de teste de 7 dias.";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { isTrial, isRouteAllowed } = useSubscription();
  const isCollapsed = state === "collapsed";

  // Itens do submenu de Compras
  const comprasSubItems = [
    { title: "Cadastro de Insumos", url: "/compras" },
    { title: "Fornecedores", url: "/fornecedores" },
    { title: "Inventário & Auditoria", url: "/inventario" },
    { title: "Lista de Compras", url: "/lista-compras" },
    { title: "Balanço de Estoque", url: "/balanco-estoque" },
    { title: "Relatório de Compras", url: "/relatorio-compras" },
  ];

  // Itens principais
  const mainMenuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
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

  const isComprasActive = comprasSubItems.some(item => location.pathname === item.url);

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(TRIAL_MESSAGE);
  };

  const renderMenuItem = (item: typeof mainMenuItems[0]) => {
    const locked = isTrial && !isRouteAllowed(item.url);

    if (locked) {
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton tooltip={item.title} onClick={handleLockedClick} className="opacity-60 cursor-not-allowed">
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
              cn("transition-all duration-300", isActive && "font-medium")
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const comprasLocked = isTrial && !isRouteAllowed("/compras");

  return (
    <Sidebar collapsible="icon" className="border-r sidebar-custom top-14 hidden md:flex">
      <SidebarHeader>
        <div className="flex items-center justify-end p-2">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem(mainMenuItems[0])}

              {comprasLocked ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Compras"
                    onClick={handleLockedClick}
                    className="opacity-60 cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Compras</span>
                    <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Collapsible defaultOpen={isComprasActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Compras" className={cn(isComprasActive && "font-medium")}>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Compras</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {comprasSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                end
                                className={({ isActive }) =>
                                  cn("transition-all duration-300", isActive && "font-medium bg-accent")
                                }
                              >
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {mainMenuItems.slice(1).map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
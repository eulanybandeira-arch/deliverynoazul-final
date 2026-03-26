import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Compras from "./pages/Compras";
import EntradaCompras from "./pages/EntradaCompras";
import Inventario from "./pages/Inventario";
import ListaCompras from "./pages/ListaCompras";
import Fornecedores from "./pages/Fornecedores";
import Receitas from "./pages/Receitas";
import ReceitasLibrary from "./pages/ReceitasLibrary";
import Metricas from "./pages/Metricas";
import Analise from "./pages/Analise";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import InventoryBalance from "./pages/InventoryBalance";
import PurchaseReport from "./pages/PurchaseReport";
import FluxoCaixa from "./pages/FluxoCaixa";
import Configuracoes from "./pages/Configuracoes";
import Legal from "./pages/Legal";
import Faq from "./pages/Faq";
import Equipamentos from "./pages/Equipamentos";
import Chat from "./pages/Chat";
import AdminKnowledge from "./pages/AdminKnowledge";
import Vsl from "./pages/Vsl";
import PrepBases from "./pages/PrepBases";
import PrepBaseDetail from "./pages/PrepBaseDetail";
import Desperdicios from "./pages/Desperdicios";
import Marketplaces from "./pages/Marketplaces";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const ProtectedLayout = () => (
  <ProtectedRoute>
    <SidebarProvider defaultOpen={true}>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </SidebarProvider>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/vsl" element={<Vsl />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/entrada-compras" element={<EntradaCompras />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/lista-compras" element={<ListaCompras />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/receitas" element={<Receitas />} />
              <Route path="/receitas/:recipeId" element={<Receitas />} />
              <Route path="/receitas/biblioteca" element={<ReceitasLibrary />} />
              <Route path="/bases-preparo" element={<PrepBases />} />
              <Route path="/bases-preparo/:id" element={<PrepBaseDetail />} />
              <Route path="/desperdicios" element={<Desperdicios />} />
              <Route path="/metricas" element={<Metricas />} />
              <Route path="/analise" element={<Analise />} />
              <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
              <Route path="/balanco-estoque" element={<InventoryBalance />} />
              <Route path="/relatorio-compras" element={<PurchaseReport />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/marketplaces" element={<Marketplaces />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/admin/conhecimento" element={<AdminKnowledge />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/faq" element={<Faq />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Plus, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Search,
  History,
  Zap,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/pricing";
import { ManualEntryModal } from "@/components/purchases/ManualEntryModal";
import { toast } from "sonner";

const MOCK_HISTORY = [
  { id: "1", date: "18/03/2026", supplier: "Atacadão Costa", total: 1870.50, responsible: "Admin", status: "Processado" },
  { id: "2", date: "17/03/2026", supplier: "Distribuidora Silva", total: 450.20, responsible: "João Silva", status: "Pendente" },
  { id: "3", date: "15/03/2026", supplier: "Hortifruti Central", total: 320.00, responsible: "Admin", status: "Processado" },
];

const MOCK_REVIEW_ITEMS = [
  { id: "r1", original: "Queijo Mussarela Fatiado 1kg", match: "Queijo Mussarela", alert: "+12% de aumento", alertType: "danger" },
  { id: "r2", original: "Tomate Longa Vida Extra", match: "Tomate Italiano", alert: "Preço estável", alertType: "success" },
  { id: "r3", original: "FILE DE PEITO FRANGO RESF", match: "Filé de Frango", alert: "-3% de redução", alertType: "success" },
];

export default function EntradaCompras() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">Entrada de Compras e Gestão de Custos</h1>
        <p className="text-muted-foreground">Central de abastecimento: onde o CMV Teórico se cruza com o CMV Real.</p>
      </header>

      {/* SEÇÃO 1: CAPTURA INTELIGENTE */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold text-primary uppercase tracking-wider">Registrar Nova Compra</CardTitle>
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="border-primary text-primary hover:bg-primary/5 font-bold">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Manualmente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-primary/30 bg-background/50 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
            <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">Arraste o XML da Nota, Foto do Recibo ou Cupom Fiscal</p>
              <p className="text-sm text-muted-foreground">Nossa IA lerá os itens e preços automaticamente para você.</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg">Selecionar Arquivo</Button>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: HISTÓRICO RECENTE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Histórico de Lançamentos Recentes</h2>
        </div>
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase py-4 pl-6">Data</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Fornecedor</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Valor Total</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Responsável</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map((h) => (
                  <TableRow key={h.id} className="hover:bg-muted/10 transition-colors border-b border-border/20">
                    <TableCell className="py-4 pl-6 font-medium text-sm">{h.date}</TableCell>
                    <TableCell className="font-bold text-sm">{h.supplier}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(h.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.responsible}</TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge className={cn(
                        "px-3 py-1 border-none text-[10px] font-bold uppercase tracking-tighter",
                        h.status === "Processado" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                      )}>
                        {h.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: REVISÃO IA (SIMULAÇÃO) */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Revisão da Nota Fiscal lida pela IA</h2>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">Nota #4592 - Atacadão Costa</Badge>
        </div>

        <Card className="border-border/40 shadow-xl overflow-hidden bg-white dark:bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase py-5 pl-6 text-muted-foreground">Item Original na Nota</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Match com Insumo do Sistema</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center text-muted-foreground">Alerta de Preço</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right pr-6 text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REVIEW_ITEMS.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors border-b border-border/20">
                    <TableCell className="py-5 pl-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-mono uppercase">{item.original}</span>
                        <span className="text-[10px] text-primary font-bold mt-1">Lido com 98% de confiança</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-background/50 px-3 py-2 rounded-xl border border-border/50 w-fit min-w-[240px] cursor-pointer hover:border-primary/50 transition-all">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">{item.match}</span>
                        <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "gap-1.5 py-1.5 px-3 border-none shadow-sm text-[10px] font-black uppercase tracking-tighter",
                        item.alertType === "danger" ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"
                      )}>
                        {item.alertType === "danger" ? <AlertTriangle className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {item.alert}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/5">Vincular</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="p-6 bg-slate-50/50 dark:bg-muted/20 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total da Nota</p>
                  <p className="text-xl font-black text-foreground font-mono">R$ 1.870,50</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Identificado</p>
                  <p className="text-xl font-black text-primary font-mono">R$ 1.870,50</p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none font-bold border-primary text-primary hover:bg-primary/5">
                  Confirmar Entrada
                </Button>
                <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Atualizar CMV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ManualEntryModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Plus, 
  History, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Search,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/utils/pricing";
import { ManualPurchaseModal } from "@/components/inventory/ManualPurchaseModal";
import { toast } from "sonner";

export default function EntradaCompras() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-foreground">Entrada de Compras e Gestão de Custos</h1>
        <p className="text-muted-foreground">Centralize o abastecimento de insumos e mantenha seu CMV real atualizado automaticamente.</p>
      </header>

      {/* SEÇÃO 1: CAPTURA INTELIGENTE */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Registrar Nova Compra</CardTitle>
                <CardDescription>Use a IA para ler suas notas ou lance manualmente.</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="border-primary text-primary hover:bg-primary/5 font-bold">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Manualmente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-primary/30 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 bg-background/50 hover:bg-background/80 transition-all cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">Arraste o XML da Nota, Foto do Recibo ou Cupom Fiscal</h3>
              <p className="text-sm text-muted-foreground">Nossa IA irá identificar itens, quantidades e preços para você.</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg">Selecionar Arquivo</Button>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: HISTÓRICO RECENTE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Histórico de Lançamentos Recentes</h2>
        </div>
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase py-4 pl-6">Data</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase">Fornecedor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right">Valor Total</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center">Responsável</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/10 transition-colors border-b border-border/20">
                  <TableCell className="py-4 pl-6 font-medium text-sm">18/03/2026</TableCell>
                  <TableCell className="font-bold text-sm">Atacadão S.A.</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">{formatCurrency(1870.50)}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">Admin</TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] font-bold uppercase">Processado</Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/10 transition-colors border-b border-border/20">
                  <TableCell className="py-4 pl-6 font-medium text-sm">17/03/2026</TableCell>
                  <TableCell className="font-bold text-sm">Hortifruti Central</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">{formatCurrency(450.20)}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">João Silva</TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">Pendente</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: REVISÃO DE IA */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Revisão da Nota Fiscal lida pela IA</h2>
          </div>
          <Badge className="bg-primary/10 text-primary border-none font-bold">Nota #88291 - Atacadão</Badge>
        </div>

        <Card className="border-border/40 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase py-5 pl-6 text-muted-foreground">Item Original na Nota</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-muted-foreground">Match com Insumo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center text-muted-foreground">Qtd/Un</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right text-muted-foreground">Preço Unit.</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-center text-muted-foreground">Alerta de Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-slate-50/50 dark:hover:bg-muted/30 transition-colors border-b border-border/20">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">QUEIJO MUSSARELA FATIADO 1KG</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Cód: 789123456</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue="mussarela">
                      <SelectTrigger className="h-9 border-primary/20 bg-background font-bold text-xs text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mussarela">Queijo Mussarela</SelectItem>
                        <SelectItem value="prato">Queijo Prato</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center font-medium text-sm">12 un</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">{formatCurrency(42.90)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-red-500/10 text-red-600 border-none text-[10px] font-bold uppercase gap-1">
                      <AlertTriangle className="h-3 w-3" /> +12% de aumento
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-6 bg-slate-50/50 dark:bg-muted/10 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total da Nota</span>
                <p className="text-xl font-black text-foreground">{formatCurrency(1870.50)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-primary">Total Identificado</span>
                <p className="text-xl font-black text-primary">{formatCurrency(1870.50)}</p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none font-bold border-primary text-primary hover:bg-primary/5">
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar CMV
              </Button>
              <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 font-bold px-10 shadow-lg shadow-primary/20">
                Confirmar Entrada <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ManualPurchaseModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
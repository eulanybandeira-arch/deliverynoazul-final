import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ShoppingCart, ChevronUp, ChevronDown, Info, Loader2 } from "lucide-react";
import { SalesChannel } from "@/types/pricing";
import { useSalesChannels } from "@/hooks/useSalesChannels";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SalesChannelsTableProps {
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
}

export function SalesChannelsTable({ selectedChannelId, onSelectChannel }: SalesChannelsTableProps) {
  const { channels, loading, addChannel, updateChannel, deleteChannel } = useSalesChannels();
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  const addCustomChannel = async () => {
    const newChannel = await addChannel({
      name: "Novo Canal",
      platformFee: 0,
      paymentFee: 0,
      cardFee: 0,
      anticipationFee: 0,
      applyAnticipation: false,
      monthlyFee: 0,
    });
    if (newChannel) {
      onSelectChannel(newChannel.id);
      setIsDetailsOpen(true);
    }
  };

  const removeChannel = async (id: string) => {
    await deleteChannel(id);
    if (selectedChannelId === id) {
      onSelectChannel(null);
    }
  };

  const handleUpdateChannel = (id: string, field: keyof SalesChannel, value: any) => {
    updateChannel(id, { [field]: value });
  };

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  if (loading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Canais de Venda e Taxas
        </CardTitle>
        <CardDescription>
          Selecione um canal para aplicar suas taxas ou adicione um novo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Select
            value={selectedChannelId ?? "none"}
            onValueChange={(value) => onSelectChannel(value === "none" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum canal</SelectItem>
              {channels.map(channel => (
                <SelectItem key={channel.id} value={channel.id}>
                  {channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={addCustomChannel}>
                Adicionar Canal Personalizado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedChannel && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen} className="p-4 border rounded-lg bg-accent/50">
            <div className="flex justify-between items-center mb-4">
              <Input
                value={selectedChannel.name}
                onChange={(e) => handleUpdateChannel(selectedChannel.id, 'name', e.target.value)}
                className="text-lg font-semibold flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0"
              />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => removeChannel(selectedChannel.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comissão Plataforma (%)</label>
                  <Input type="number" value={selectedChannel.platformFee === 0 ? '' : selectedChannel.platformFee} onChange={(e) => handleUpdateChannel(selectedChannel.id, 'platformFee', Number(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Taxa de Pagamento (%)</label>
                    {selectedChannel.name.includes('99Food') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>A taxa é cobrada somente quando o cliente paga através da plataforma 99Food.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Input type="number" value={selectedChannel.paymentFee === 0 ? '' : selectedChannel.paymentFee} onChange={(e) => handleUpdateChannel(selectedChannel.id, 'paymentFee', Number(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Máquina de Cartão (%)</label>
                  <Input type="number" value={selectedChannel.cardFee === 0 ? '' : selectedChannel.cardFee} onChange={(e) => handleUpdateChannel(selectedChannel.id, 'cardFee', Number(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxa Antecipação (%)</label>
                  <Input type="number" value={selectedChannel.anticipationFee === 0 ? '' : selectedChannel.anticipationFee} onChange={(e) => handleUpdateChannel(selectedChannel.id, 'anticipationFee', Number(e.target.value) || 0)} disabled={!selectedChannel.applyAnticipation} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium">Taxa Fixa Mensal (R$)</label>
                    {selectedChannel.name.includes('iFood') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Primeiro mês grátis. Mensalidade cobrada para faturamento acima de R$ 1.800,00/mês.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <Input type="number" value={selectedChannel.monthlyFee === 0 ? '' : selectedChannel.monthlyFee} onChange={(e) => handleUpdateChannel(selectedChannel.id, 'monthlyFee', Number(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch id={`anticipation-${selectedChannel.id}`} checked={selectedChannel.applyAnticipation} onCheckedChange={(checked) => handleUpdateChannel(selectedChannel.id, 'applyAnticipation', checked)} />
                  <label htmlFor={`anticipation-${selectedChannel.id}`}>Aplicar Antecipação</label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

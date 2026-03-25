import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Edit, FileText, LineChart } from "lucide-react";
import { InventoryItem, LOGISTICS_CATEGORY_OPTIONS, UTENSIL_TYPE_OPTIONS } from "@/types/inventory";
import { PurchaseInvoice } from "@/types/invoice";
import { formatCurrency, formatQuantity, formatCostPerUnit } from "@/utils/pricing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { PriceHistoryDialog } from "./PriceHistoryDialog";

interface InventoryTableProps {
  items: InventoryItem[];
  invoices: PurchaseInvoice[];
  onDelete: (id: string) => void;
  onEdit: (item: InventoryItem) => void;
}

export function InventoryTable({ items, invoices, onDelete, onEdit }: InventoryTableProps) {
  const [priceHistoryItem, setPriceHistoryItem] = useState<{ id: string; name: string } | null>(null);

  const isLowStock = (item: InventoryItem) => {
    return item.current_stock <= item.min_alert_level;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString.replace(/-/g, '\/'));
    return date.toLocaleDateString('pt-BR');
  };

  const getCategoryLabel = (value?: string) => {
    return LOGISTICS_CATEGORY_OPTIONS.find(opt => opt.value === value)?.label || value || "-";
  };

  const getUtensilLabel = (value?: string) => {
    return UTENSIL_TYPE_OPTIONS.find(opt => opt.value === value)?.label || value || "-";
  };

  const getInvoiceUrl = (noteId?: string) => {
    if (!noteId) return null;
    const inv = invoices.find(inv => inv.id === noteId);
    return inv?.file_url || inv?.link;
  };

  return (
    <>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhum insumo cadastrado
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead>Custo por U.E.</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque em U.C.</TableHead>
                <TableHead>Nível Mínimo</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const invoiceUrl = getInvoiceUrl(item.purchase_note_id);
                return (
                  <TableRow 
                    key={item.id}
                    className={isLowStock(item) ? "bg-metric-orange/10" : ""}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <Badge variant={isLowStock(item) ? "destructive" : "secondary"} className="w-20 justify-center shrink-0">
                        {formatQuantity(item.quantity_purchased, item.purchase_unit)}
                      </Badge>
                      <span>{item.name}</span>
                    </TableCell>
                    <TableCell>
                      {item.category_logistics === 'embalagens_utensilios' ? (
                        <div className="text-xs">
                          {item.utensil_type && <p className="font-semibold">{getUtensilLabel(item.utensil_type)}</p>}
                          {item.package_capacity && <p className="text-muted-foreground">{item.package_capacity}</p>}
                        </div>
                      ) : (
                        item.brand || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(item.category_logistics)}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.unit_cost || 0)}</TableCell>
                    <TableCell>{formatCostPerUnit(item.cost_per_stock_unit)} / {item.stock_unit === 'unidade' ? 'un' : item.stock_unit}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={isLowStock(item) ? "destructive" : "secondary"} className="cursor-help">
                              {formatQuantity(item.current_stock, item.stock_unit)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Estoque em {item.stock_unit === 'unidade' ? 'un' : item.stock_unit}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              {formatQuantity(Math.round((item.current_stock / item.conversion_factor) * 100) / 100, item.purchase_unit)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Estoque em {item.purchase_unit}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {item.min_alert_unit === item.purchase_unit 
                        ? formatQuantity(item.min_alert_level / item.conversion_factor, item.purchase_unit)
                        : formatQuantity(item.min_alert_level, item.min_alert_unit || item.stock_unit)
                      }
                    </TableCell>
                    <TableCell>{item.category_logistics === 'embalagens_utensilios' ? 'N/A' : formatDate(item.expiry_date)}</TableCell>
                    <TableCell>
                      {isLowStock(item) && (
                        <div className="flex items-center gap-1 text-metric-orange">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-semibold">Alerta</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPriceHistoryItem({ id: item.id, name: item.name })}
                            >
                              <LineChart className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver histórico de preços</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {invoiceUrl && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {priceHistoryItem && (
        <PriceHistoryDialog
          open={!!priceHistoryItem}
          onOpenChange={(open) => !open && setPriceHistoryItem(null)}
          itemId={priceHistoryItem.id}
          itemName={priceHistoryItem.name}
        />
      )}
    </>
  );
}
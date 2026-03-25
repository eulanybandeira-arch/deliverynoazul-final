import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CashFlowEntry, INCOME_CATEGORIES, EXPENSE_CATEGORIES, STATUS_OPTIONS, LOCATION_OPTIONS } from "@/types/cashflow";

interface SimpleRecipe {
  id: string;
  name: string;
  yield: number;
}

interface CashFlowFormProps {
  recipes: SimpleRecipe[];
  onSubmit: (entry: Omit<CashFlowEntry, 'id'>) => void;
}

const initialFormData: Omit<CashFlowEntry, 'id'> = {
  date: new Date().toISOString(),
  description: "",
  value: 0,
  type: 'saída',
  category: "insumos",
  status: 'efetuado',
  location: 'conta_corrente',
  recipe_id: undefined,
  quantity_sold: 1,
};

export function CashFlowForm({ recipes, onSubmit }: CashFlowFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [displayValue, setDisplayValue] = useState("");
  const isSale = formData.type === 'entrada' && formData.category === 'venda';

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/\D/g, "");
    if (numbers === "") {
      setFormData({ ...formData, value: 0 });
      setDisplayValue("");
      return;
    }
    const numeric = parseInt(numbers) / 100;
    setFormData({ ...formData, value: numeric });
    setDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(initialFormData);
    setDisplayValue("");
  };

  const categories = formData.type === 'entrada' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Lançamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value: 'entrada' | 'saída') => setFormData({ ...formData, type: value, category: value === 'entrada' ? 'venda' : 'insumos' })}
                className="flex items-center space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entrada" id="entrada" />
                  <Label htmlFor="entrada">Entrada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saída" id="saída" />
                  <Label htmlFor="saída">Saída</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(formData.date), "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.date)}
                    onSelect={(date) => date && setFormData({ ...formData, date: date.toISOString() })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input id="value" value={displayValue} onChange={handleValueChange} placeholder="R$ 0,00" required />
            </div>
          </div>

          {isSale && (
            <div className="grid md:grid-cols-2 gap-4 p-4 border bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="recipe_id">Receita Vendida (para baixa de estoque)</Label>
                <Select value={formData.recipe_id} onValueChange={(value) => setFormData({ ...formData, recipe_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a receita" /></SelectTrigger>
                  <SelectContent>
                    {recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_sold">Quantidade de Porções</Label>
                <Input
                  id="quantity_sold"
                  type="number"
                  min="1"
                  value={formData.quantity_sold}
                  onChange={(e) => setFormData({ ...formData, quantity_sold: Number(e.target.value) || 1 })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Lançamento</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Venda balcão, Pedido iFood #123"
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Situação</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização do Caixa</Label>
              <Select value={formData.location} onValueChange={(value: any) => setFormData({ ...formData, location: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lançamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
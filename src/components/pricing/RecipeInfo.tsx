import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

interface RecipeInfoProps {
  recipeName: string;
  recipeYield: number;
  onNameChange: (name: string) => void;
  onYieldChange: (yieldValue: number) => void;
}

export function RecipeInfo({ recipeName, recipeYield, onNameChange, onYieldChange }: RecipeInfoProps) {
  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Informações da Receita
        </CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipeName">Nome da Receita</Label>
          <Input
            id="recipeName"
            value={recipeName}
            onChange={(e) => onNameChange(e.target.value)}
            className="border-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipeYield">Quantidade que a Receita Rende</Label>
          <Input
            id="recipeYield"
            type="number"
            value={recipeYield === 0 ? '' : recipeYield}
            min="0"
            placeholder="Ex: 10 porções, 500 ml"
            onChange={(e) => onYieldChange(Number(e.target.value) || 0)}
            className="border-input"
          />
        </div>
      </CardContent>
    </Card>
  );
}
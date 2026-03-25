import { Ingredient, Packaging } from "@/types/pricing";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCostPerUnit = (value: number): string => {
  if (isNaN(value) || !isFinite(value) || value === 0) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(0);
  }

  // Arredonda para cima na 4ª casa decimal
  const roundedValue = Math.ceil(value * 10000) / 10000;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(roundedValue);
};

export const formatQuantity = (value: number, unit: string): string => {
  if (isNaN(value)) {
    return `- ${unit}`;
  }
  const formattedUnit = unit === 'unidade' ? 'un' : unit;
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formattedValue} ${formattedUnit}`;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
};

// Fatores de conversão para unidades (sincronizado com UNIT_OPTIONS em types/pricing.ts)
const UNIT_CONVERSION: Record<string, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  mL: 1,
  unidade: 1,
  pacote: 1,
  gotas: 1,
  folha: 1,
  colher_sopa: 1,
  colher_cha: 1,
  xicara_1_4: 0.25,
  xicara_1_3: 0.33,
  xicara_1_2: 0.5,
  xicara_2_3: 0.67,
  xicara_3_4: 0.75,
  xicara: 1,
  custom: 1,
};

export const calculateIngredientValue = (ingredient: Ingredient): number => {
  const packageUnit = ingredient.unit;
  const usedUnit = ingredient.usedUnit || packageUnit;
  
  // Converter a quantidade utilizada para a mesma base do pacote
  const packageFactor = UNIT_CONVERSION[packageUnit] || 1;
  const usedFactor = UNIT_CONVERSION[usedUnit] || 1;
  
  // Se unidades são compatíveis (mesma família), converter
  // Ex: pacote em kg (1000g), uso em 200g -> 200 / 1000 = 0.2 kg usado
  // Ex: pacote em L (1000mL), uso em 500mL -> 500 / 1000 = 0.5 L usado
  // A quantidade usada (em usedUnit) precisa ser convertida para packageUnit
  // usedQty está em usedFactor base, packageQty está em packageFactor base
  const usedQtyInPackageUnit = (ingredient.usedQty * usedFactor) / packageFactor;
  
  const baseValue = (usedQtyInPackageUnit / ingredient.packageQty) * ingredient.unitPrice;
  const lossMultiplier = ingredient.loss ? (1 + ingredient.loss / 100) : 1;
  return baseValue * lossMultiplier;
};

export const calculatePackagingValue = (pkg: Packaging): number => {
  return (pkg.usedQty / pkg.packageQty) * pkg.packagePrice;
};

export const roundToPsychological = (value: number, enabled: boolean = true): number => {
  if (!enabled || value <= 0) return value;
  const integerPart = Math.floor(value);
  return integerPart + 0.90;
};

export const getExpenseColor = (percentage: number): string => {
  if (percentage <= 30) return "text-green-600 dark:text-green-400";
  if (percentage <= 33) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

export const getExpenseStatus = (percentage: number): { 
  color: string; 
  status: string; 
  icon: string;
} => {
  if (percentage <= 30) {
    return { 
      color: "success", 
      status: "Saudável", 
      icon: "✓" 
    };
  }
  if (percentage <= 33) {
    return { 
      color: "warning", 
      status: "Atenção", 
      icon: "⚠" 
    };
  }
  return { 
    color: "destructive", 
    status: "Crítico", 
    icon: "⚠" 
  };
};

export const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return defaultValue;
  }
};
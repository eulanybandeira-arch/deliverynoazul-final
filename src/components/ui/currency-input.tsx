import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number;
  onValueChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(formatToCurrency(value));

    React.useEffect(() => {
      setDisplayValue(formatToCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove tudo exceto números
      const numbers = inputValue.replace(/\D/g, "");
      
      // Converte para número (centavos)
      const numeric = parseInt(numbers || "0") / 100;
      
      setDisplayValue(formatToCurrency(numeric));
      
      if (onValueChange) {
        onValueChange(numeric);
      }
    };

    return (
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={cn(className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

function formatToCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export { CurrencyInput };

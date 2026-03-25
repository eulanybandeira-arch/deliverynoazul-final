import { useState, useCallback } from "react";

export function useCurrencyInput(initialValue: number = 0) {
  const [displayValue, setDisplayValue] = useState(
    formatToCurrency(initialValue)
  );
  const [numericValue, setNumericValue] = useState(initialValue);

  const handleChange = useCallback((value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");
    
    // Converte para número (centavos)
    const numeric = parseInt(numbers || "0") / 100;
    
    setNumericValue(numeric);
    setDisplayValue(formatToCurrency(numeric));
  }, []);

  return {
    displayValue,
    numericValue,
    handleChange,
    setNumericValue: (value: number) => {
      setNumericValue(value);
      setDisplayValue(formatToCurrency(value));
    },
  };
}

function formatToCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

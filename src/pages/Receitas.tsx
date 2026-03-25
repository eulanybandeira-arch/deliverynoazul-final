import { PricingCalculator } from "@/components/PricingCalculator";
import { useParams } from "react-router-dom"; // Import useParams

export default function Receitas() {
  const { recipeId } = useParams<{ recipeId?: string }>(); // Get recipeId from URL

  return <PricingCalculator key={recipeId || "new"} />; // Use key to force re-render when recipeId changes
}
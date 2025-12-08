import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onFindRecipe: () => void;
}

/**
 * Komponent EmptyState wyświetlany gdy użytkownik nie ma historii gotowania
 */
export function EmptyState({ onFindRecipe }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <ChefHat className="w-16 h-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Nie ugotowałeś jeszcze żadnego przepisu</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Znajdź przepis dopasowany do Twojej lodówki i rozpocznij gotowanie
      </p>
      <Button onClick={onFindRecipe} size="lg">
        Znajdź przepis
      </Button>
    </div>
  );
}

/**
 * ShoppingListEmptyState - Empty state dla listy zakupów
 *
 * Wyświetlany gdy:
 * 1. API zwróciło pustą listę (wszystkie składniki dostępne)
 * 2. Użytkownik usunął wszystkie pozycje z listy
 */

import { Button } from "../ui/button";

interface ShoppingListEmptyStateProps {
  /**
   * Typ empty state - determinuje wyświetlany komunikat
   */
  variant: "all-available" | "user-cleared";
  /**
   * Callback dla przycisku zamknięcia
   */
  onClose?: () => void;
  /**
   * Callback dla przycisku regeneracji (tylko dla 'user-cleared')
   */
  onRegenerate?: () => void;
}

/**
 * Komponent empty state z dwoma wariantami
 */
export function ShoppingListEmptyState({ variant, onClose, onRegenerate }: ShoppingListEmptyStateProps) {
  if (variant === "all-available") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
        <p className="text-4xl">🎉</p>
        <div className="space-y-2">
          <p className="text-xl font-bold">Wszystkie składniki dostępne!</p>
          <p className="text-muted-foreground max-w-md">
            Masz wszystko co potrzebne do przygotowania tego przepisu. Możesz przystąpić do gotowania!
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="default" className="mt-4">
            Zamknij
          </Button>
        )}
      </div>
    );
  }

  // variant === 'user-cleared'
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <p className="text-4xl">📋</p>
      <div className="space-y-2">
        <p className="text-xl font-bold">Lista jest pusta</p>
        <p className="text-muted-foreground max-w-md">
          Wszystkie składniki zostały usunięte z listy. Możesz wygenerować listę ponownie lub zamknąć okno.
        </p>
      </div>
      <div className="flex gap-2 mt-4">
        {onRegenerate && (
          <Button onClick={onRegenerate} variant="default">
            Regeneruj listę
          </Button>
        )}
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Zamknij
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ShoppingListErrorState - Error state dla listy zakupów
 * 
 * Wyświetlany gdy wystąpi błąd podczas generowania listy zakupów.
 */

import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

interface ShoppingListErrorStateProps {
  /**
   * Komunikat błędu do wyświetlenia
   */
  errorMessage: string;
  /**
   * Callback dla przycisku "Spróbuj ponownie"
   */
  onRetry?: () => void;
  /**
   * Callback dla przycisku "Zamknij"
   */
  onClose?: () => void;
}

/**
 * Komponent error state z możliwością retry
 */
export function ShoppingListErrorState({
  errorMessage,
  onRetry,
  onClose,
}: ShoppingListErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
      {/* Error icon */}
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      {/* Error message */}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-destructive">Wystąpił błąd</p>
        <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Spróbuj ponownie
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


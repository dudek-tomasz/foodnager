/**
 * ShoppingListModal - Główny komponent modalny dla listy zakupów
 * 
 * Modal generuje i wyświetla listę brakujących składników do przepisu.
 * Użytkownik może edytować ilości, odznaczać pozycje i eksportować listę.
 */

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { generateShoppingListForRecipe } from '../../lib/api/shopping-list-client';
import { formatForClipboard, copyToClipboard, exportToTxtFile, printShoppingList } from './utils';
import { EditableShoppingList } from './EditableShoppingList';
import { ShoppingListSkeleton } from './ShoppingListSkeleton';
import { ShoppingListEmptyState } from './ShoppingListEmptyState';
import { ShoppingListErrorState } from './ShoppingListErrorState';
import type {
  ShoppingListModalProps,
  ShoppingListState,
  EditableShoppingListItem,
} from './types';
import type { ShoppingListResponseDTO } from '../../types';

/**
 * Modal komponent dla generowania i zarządzania listą zakupów
 */
export function ShoppingListModal({
  recipeId,
  recipeTitle,
  isOpen,
  onClose,
  onSuccess,
}: ShoppingListModalProps) {
  // Stan komponentu
  const [state, setState] = useState<ShoppingListState>({
    loading: false,
    error: null,
    recipe: null,
    items: [],
    totalItems: 0,
  });

  // Stan dla slow loading warning
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  
  // Timeout refs dla cleanup
  const slowWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (slowWarningTimeoutRef.current) {
        clearTimeout(slowWarningTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Generuje listę zakupów przy otwarciu modala
   */
  useEffect(() => {
    if (!isOpen) {
      // Reset warning state when modal closes
      setShowSlowWarning(false);
      return;
    }

    // Walidacja recipeId
    if (!recipeId || recipeId <= 0) {
      console.error('Invalid recipeId:', recipeId);
      toast.error('Błąd: nieprawidłowe ID przepisu');
      onClose();
      return;
    }

    // Walidacja recipeTitle (fallback jeśli pusty)
    if (!recipeTitle || recipeTitle.trim() === '') {
      console.warn('Empty recipeTitle, using fallback');
    }

    generateShoppingList();
  }, [isOpen, recipeId]);

  /**
   * Wywołuje API i generuje listę zakupów
   */
  const generateShoppingList = async () => {
    // Zapobiegaj multiple calls gdy już loading
    if (state.loading) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    setShowSlowWarning(false);

    // Setup slow loading warning (5 seconds)
    slowWarningTimeoutRef.current = setTimeout(() => {
      setShowSlowWarning(true);
    }, 5000);

    try {
      const response: ShoppingListResponseDTO = await generateShoppingListForRecipe(recipeId);

      // Clear slow warning timeout
      if (slowWarningTimeoutRef.current) {
        clearTimeout(slowWarningTimeoutRef.current);
        slowWarningTimeoutRef.current = null;
      }

      // Przekształć dane API na EditableShoppingListItem
      const editableItems: EditableShoppingListItem[] = response.missing_ingredients.map(
        (item, index) => ({
          ...item,
          id: `item-${index}-${item.product.id}`,
          checked: true,
          editedQuantity: item.missing_quantity,
        })
      );

      setState({
        loading: false,
        error: null,
        recipe: response.recipe,
        items: editableItems,
        totalItems: response.total_items,
      });

      setShowSlowWarning(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Shopping list generation error:', error);
      
      // Clear slow warning timeout
      if (slowWarningTimeoutRef.current) {
        clearTimeout(slowWarningTimeoutRef.current);
        slowWarningTimeoutRef.current = null;
      }
      
      setShowSlowWarning(false);
      handleApiError(error);
    }
  };

  /**
   * Obsługuje błędy z API
   */
  const handleApiError = (error: any) => {
    let errorMessage = 'Wystąpił nieoczekiwany błąd';

    if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Nieprawidłowe dane przepisu';
          setTimeout(() => onClose(), 2000);
          break;
        case 401:
          errorMessage = 'Wymagane logowanie';
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          break;
        case 404:
          errorMessage = 'Przepis nie został znaleziony';
          setTimeout(() => onClose(), 2000);
          break;
        case 500:
        default:
          errorMessage = 'Błąd serwera. Spróbuj ponownie za chwilę.';
      }
    } else if (!navigator.onLine) {
      errorMessage = 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.';
    }

    setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    toast.error(errorMessage);
  };

  /**
   * Obsługuje zmianę stanu checkbox pozycji
   */
  const handleItemCheck = (itemId: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, checked } : item
      ),
    }));
  };

  /**
   * Obsługuje zmianę ilości składnika
   */
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0 || isNaN(newQuantity)) {
      return; // Walidacja
    }

    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, editedQuantity: newQuantity } : item
      ),
    }));
  };

  /**
   * Obsługuje usunięcie pozycji z listy
   */
  const handleItemRemove = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  /**
   * Kopiuje listę do schowka
   */
  const handleCopyToClipboard = async () => {
    const checkedItems = state.items.filter((item) => item.checked);

    if (checkedItems.length === 0) {
      toast.warning('Zaznacz przynajmniej jeden składnik do skopiowania');
      return;
    }

    const text = formatForClipboard(state.items, state.recipe?.title || recipeTitle);
    const success = await copyToClipboard(text);

    if (success) {
      toast.success('Skopiowano do schowka');
    } else {
      toast.error('Nie udało się skopiować. Spróbuj ponownie.');
    }
  };

  /**
   * Drukuje listę zakupów
   */
  const handlePrint = () => {
    const checkedItems = state.items.filter((item) => item.checked);

    if (checkedItems.length === 0) {
      toast.warning('Zaznacz przynajmniej jeden składnik do wydrukowania');
      return;
    }

    printShoppingList();
  };

  /**
   * Eksportuje listę do pliku .txt
   */
  const handleExportTxt = () => {
    const checkedItems = state.items.filter((item) => item.checked);

    if (checkedItems.length === 0) {
      toast.warning('Zaznacz przynajmniej jeden składnik do eksportu');
      return;
    }

    exportToTxtFile(state.items, state.recipe?.title || recipeTitle);
    toast.success('Lista zakupów pobrana');
  };

  // Sprawdzenie czy można eksportować (minimum 1 zaznaczona pozycja)
  const canExport = state.items.some((item) => item.checked);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col"
        aria-describedby="shopping-list-description"
      >
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold" id="shopping-list-title">
              Lista zakupów: {state.recipe?.title || recipeTitle}
            </DialogTitle>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                aria-label="Zamknij listę zakupów"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Zamknij</span>
              </Button>
            </DialogClose>
          </div>
          {/* Hidden description for screen readers */}
          <p id="shopping-list-description" className="sr-only">
            Modal z listą brakujących składników do przepisu. Możesz edytować ilości, odznaczać pozycje i eksportować listę.
          </p>
        </DialogHeader>

        {/* Content - Przewijany obszar */}
        <div className="flex-1 overflow-y-auto py-4 shopping-list-content">
          {/* Loading state */}
          {state.loading && (
            <div className="space-y-4">
              <ShoppingListSkeleton />
              {showSlowWarning && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-muted">
                  <p className="text-sm text-muted-foreground text-center">
                    ⏱️ Generowanie trwa dłużej niż zwykle. Proszę czekać...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {state.error && !state.loading && (
            <ShoppingListErrorState
              errorMessage={state.error}
              onRetry={generateShoppingList}
              onClose={onClose}
            />
          )}

          {/* Empty state - wszystkie składniki dostępne */}
          {!state.loading && !state.error && state.totalItems === 0 && (
            <ShoppingListEmptyState variant="all-available" onClose={onClose} />
          )}

          {/* Normal state - lista składników */}
          {!state.loading && !state.error && state.items.length > 0 && (
            <EditableShoppingList items={state.items} onItemsChange={(items) => setState(prev => ({ ...prev, items }))} />
          )}
        </div>

        {/* Footer - Przyciski akcji */}
        {!state.loading && !state.error && state.items.length > 0 && (
          <DialogFooter className="flex-col sm:flex-row gap-2 shopping-list-modal-footer">
            <Button
              onClick={handleCopyToClipboard}
              disabled={!canExport}
              variant="default"
              className="flex-1 transition-all hover:scale-[1.02]"
              title={!canExport ? 'Zaznacz przynajmniej jeden składnik' : 'Kopiuj listę do schowka'}
              aria-label={!canExport ? 'Kopiuj do schowka - wymagane zaznaczenie składników' : 'Kopiuj listę do schowka'}
            >
              Kopiuj do schowka
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!canExport}
              variant="secondary"
              className="flex-1 transition-all hover:scale-[1.02]"
              title={!canExport ? 'Zaznacz przynajmniej jeden składnik' : 'Wydrukuj listę zakupów'}
              aria-label={!canExport ? 'Drukuj - wymagane zaznaczenie składników' : 'Wydrukuj listę zakupów'}
            >
              Drukuj
            </Button>
            <Button
              onClick={handleExportTxt}
              disabled={!canExport}
              variant="secondary"
              className="flex-1 transition-all hover:scale-[1.02]"
              title={!canExport ? 'Zaznacz przynajmniej jeden składnik' : 'Eksportuj listę do pliku tekstowego'}
              aria-label={!canExport ? 'Eksportuj .txt - wymagane zaznaczenie składników' : 'Eksportuj listę do pliku tekstowego'}
            >
              Eksportuj .txt
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              aria-label="Zamknij modal listy zakupów"
            >
              Zamknij
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


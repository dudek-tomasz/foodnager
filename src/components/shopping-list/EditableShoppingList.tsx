/**
 * EditableShoppingList - Lista edytowalnych pozycji zakupowych
 *
 * Komponent prezentuje listę brakujących składników z możliwością edycji ilości,
 * zaznaczania/odznaczania i usuwania pozycji.
 */

import { ShoppingListItem } from "./ShoppingListItem";
import type { EditableShoppingListProps } from "./types";

/**
 * Komponent wyświetlający edytowalną listę składników
 */
export function EditableShoppingList({ items, onItemsChange }: EditableShoppingListProps) {
  /**
   * Obsługuje zmianę stanu checkbox dla konkretnej pozycji
   */
  const handleItemCheck = (itemId: string, checked: boolean) => {
    const updatedItems = items.map((item) => (item.id === itemId ? { ...item, checked } : item));
    onItemsChange(updatedItems);
  };

  /**
   * Obsługuje zmianę ilości dla konkretnej pozycji
   */
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const updatedItems = items.map((item) => (item.id === itemId ? { ...item, editedQuantity: newQuantity } : item));
    onItemsChange(updatedItems);
  };

  /**
   * Obsługuje usunięcie pozycji z listy
   */
  const handleRemove = (itemId: string) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  // Empty state - gdy użytkownik usunął wszystkie pozycje
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
        <p className="text-2xl">📋</p>
        <p className="text-lg font-semibold">Lista jest pusta</p>
        <p className="text-sm text-muted-foreground">Wszystkie składniki zostały usunięte z listy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info header */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {items.length} {items.length === 1 ? "składnik" : "składników"} do kupienia
      </p>

      {/* Lista pozycji */}
      <div className="space-y-2" role="list" aria-label="Lista brakujących składników">
        {items.map((item) => (
          <ShoppingListItem
            key={item.id}
            item={item}
            onCheckedChange={(checked) => handleItemCheck(item.id, checked)}
            onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </div>

      {/* Hint dla użytkownika */}
      <p className="text-xs text-muted-foreground mt-4">
        💡 Odznacz niepotrzebne składniki lub dostosuj ilości przed eksportem
      </p>
    </div>
  );
}

/**
 * ViewModels i typy dla Shopping List Modal
 * Rozszerzenia typów z src/types.ts specyficzne dla widoku
 */

import type { RecipeReferenceDTO, ShoppingListItemDTO } from "../../types";

/**
 * Props głównego komponentu ShoppingListModal
 */
export interface ShoppingListModalProps {
  /** ID przepisu do generowania listy */
  recipeId: number;
  /** Tytuł przepisu (do wyświetlenia w nagłówku) */
  recipeTitle: string;
  /** Kontrola widoczności modala */
  isOpen: boolean;
  /** Callback zamknięcia modala */
  onClose: () => void;
  /** Optional callback po sukcesie (do refresh w parent) */
  onSuccess?: () => void;
}

/**
 * Stan wewnętrzny komponentu ShoppingListModal
 */
export interface ShoppingListState {
  /** Czy trwa ładowanie danych z API */
  loading: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
  /** Informacje o przepisie */
  recipe: RecipeReferenceDTO | null;
  /** Edytowalna lista pozycji */
  items: EditableShoppingListItem[];
  /** Liczba pozycji (z API) */
  totalItems: number;
}

/**
 * Rozszerzona wersja ShoppingListItemDTO z dodatkowymi polami UI
 */
export interface EditableShoppingListItem extends ShoppingListItemDTO {
  /** Unikalny identyfikator (dla key w React) */
  id: string;
  /** Czy item jest zaznaczony (domyślnie true) */
  checked: boolean;
  /** Edytowana ilość (początkowo = missing_quantity) */
  editedQuantity: number;
}

/**
 * Format eksportu listy zakupów
 */
export type ExportFormat = "clipboard" | "print" | "txt";

/**
 * Format pojedynczej pozycji do eksportu
 */
export interface FormattedShoppingListItem {
  productName: string;
  quantity: number;
  unit: string;
}

/**
 * Props dla EditableShoppingList
 */
export interface EditableShoppingListProps {
  items: EditableShoppingListItem[];
  onItemsChange: (items: EditableShoppingListItem[]) => void;
}

/**
 * Props dla pojedynczego ShoppingListItem
 */
export interface ShoppingListItemProps {
  item: EditableShoppingListItem;
  onCheckedChange: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

/**
 * Reprezentacja błędu z API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

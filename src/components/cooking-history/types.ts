/**
 * Model widoku dla statystyk historii
 */
export interface HistoryStats {
  totalEntries: number;
  newestDate: string | null;
  oldestDate: string | null;
}

/**
 * Filtry dla widoku historii gotowania
 */
export interface HistoryFilters {
  recipeId?: number;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

/**
 * Kompletny stan filtrów i paginacji dla widoku
 */
export interface HistoryListState {
  filters: HistoryFilters;
  page: number;
  limit: number;
}

/**
 * Rozszerzony wpis historii z computed properties
 */
export interface HistoryEntryViewModel {
  id: number;
  recipe: {
    id: number;
    title: string;
  };
  cooked_at: string;
  fridge_state_before: {
    items: {
      product_id: number;
      product_name: string;
      quantity: number;
      unit: string;
    }[];
  };
  fridge_state_after: {
    items: {
      product_id: number;
      product_name: string;
      quantity: number;
      unit: string;
    }[];
  };
  formattedDate: string; // Relative lub absolute date
  usedIngredientsCount: number;
  changedProductIds: number[]; // IDs produktów, które się zmieniły
  isExpanded: boolean; // Lokalny stan UI
}

/**
 * Zmiany w stanie lodówki (computed)
 */
export interface FridgeChanges {
  productId: number;
  productName: string;
  quantityBefore: number;
  quantityAfter: number;
  difference: number; // negative = consumed
  unit: string;
}

/**
 * Props dla głównego widoku (z SSR)
 */
export interface CookingHistoryPageProps {
  initialData?: import("../../types").CookingHistoryListResponseDTO;
}

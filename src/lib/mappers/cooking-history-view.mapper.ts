import type { CookingHistoryDTO, FridgeStateDTO } from "../../types";
import type { HistoryEntryViewModel, FridgeChanges, HistoryStats } from "../../components/cooking-history/types";

/**
 * Formatuje datę gotowania w czytelny format
 * - Dla < 24h: "Dziś, HH:MM"
 * - Dla < 48h: "Wczoraj, HH:MM"
 * - Dla starszych: "DD.MM.YYYY, HH:MM"
 */
export function formatCookingDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return `Dziś, ${date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (diffHours < 48) {
    return `Wczoraj, ${date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else {
    return `${date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}, ${date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

/**
 * Oblicza IDs produktów, które się zmieniły między stanem przed i po
 */
export function calculateChangedProducts(before: FridgeStateDTO, after: FridgeStateDTO): number[] {
  const changedIds: number[] = [];

  before.items.forEach((beforeItem) => {
    const afterItem = after.items.find((item) => item.product_id === beforeItem.product_id);

    if (!afterItem || afterItem.quantity !== beforeItem.quantity) {
      changedIds.push(beforeItem.product_id);
    }
  });

  return changedIds;
}

/**
 * Oblicza szczegółowe zmiany w stanie lodówki
 */
export function calculateFridgeChanges(before: FridgeStateDTO, after: FridgeStateDTO): FridgeChanges[] {
  const changes: FridgeChanges[] = [];

  before.items.forEach((beforeItem) => {
    const afterItem = after.items.find((item) => item.product_id === beforeItem.product_id);

    const quantityAfter = afterItem ? afterItem.quantity : 0;
    const difference = quantityAfter - beforeItem.quantity;

    if (difference !== 0) {
      changes.push({
        productId: beforeItem.product_id,
        productName: beforeItem.product_name,
        quantityBefore: beforeItem.quantity,
        quantityAfter: quantityAfter,
        difference: difference,
        unit: beforeItem.unit,
      });
    }
  });

  return changes;
}

/**
 * Oblicza statystyki historii gotowania
 */
export function calculateHistoryStats(entries: CookingHistoryDTO[]): HistoryStats {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      newestDate: null,
      oldestDate: null,
    };
  }

  const dates = entries.map((e) => new Date(e.cooked_at));
  dates.sort((a, b) => b.getTime() - a.getTime());

  return {
    totalEntries: entries.length,
    newestDate: dates[0].toISOString(),
    oldestDate: dates[dates.length - 1].toISOString(),
  };
}

/**
 * Transformuje DTO historii gotowania do ViewModelu
 */
export function mapHistoryDTOToViewModel(dto: CookingHistoryDTO, isExpanded = false): HistoryEntryViewModel {
  const changedProductIds = calculateChangedProducts(dto.fridge_state_before, dto.fridge_state_after);

  return {
    ...dto,
    formattedDate: formatCookingDate(dto.cooked_at),
    usedIngredientsCount: changedProductIds.length,
    changedProductIds,
    isExpanded,
  };
}

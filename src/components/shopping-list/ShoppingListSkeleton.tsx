/**
 * ShoppingListSkeleton - Loading state dla listy zakupów
 *
 * Wyświetla animowane placeholder podczas ładowania danych z API.
 */

import { Skeleton } from "../ui/skeleton";

/**
 * Skeleton loader dla pojedynczej pozycji
 */
function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {/* Checkbox skeleton */}
      <Skeleton className="h-5 w-5 rounded flex-shrink-0" />

      {/* Nazwa produktu skeleton */}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Quantity input skeleton */}
      <Skeleton className="h-9 w-20" />

      {/* Jednostka skeleton */}
      <Skeleton className="h-4 w-8" />

      {/* Remove button skeleton */}
      <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
    </div>
  );
}

/**
 * Komponent loading state dla całej listy
 */
export function ShoppingListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header text skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Lista skeleton items */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonItem key={index} />
        ))}
      </div>

      {/* Loading message */}
      <p className="text-center text-sm text-muted-foreground animate-pulse mt-6">Generowanie listy zakupów...</p>
    </div>
  );
}

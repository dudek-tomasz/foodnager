import { HistoryCard } from "./HistoryCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { CookingHistoryDTO } from "../../types";

interface HistoryTimelineProps {
  historyEntries: CookingHistoryDTO[];
  loading: boolean;
  onRecipeClick: (id: number) => void;
  onCookAgain: (id: number) => void;
  expandedCards?: Set<number>;
  onToggleCardExpansion?: (id: number) => void;
  showEmptyState?: boolean;
}

/**
 * Lista chronologiczna wyświetlająca karty wydarzeń gotowania
 */
export function HistoryTimeline({
  historyEntries,
  loading,
  onRecipeClick,
  onCookAgain,
  expandedCards = new Set(),
  onToggleCardExpansion,
  showEmptyState = true,
}: HistoryTimelineProps) {
  // Loading state - skeleton cards
  if (loading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-live="polite" aria-label="Ładowanie historii">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (historyEntries.length === 0 && showEmptyState) {
    return (
      <EmptyState
        onFindRecipe={() => {
          window.location.href = "/recipes/search";
        }}
      />
    );
  }

  // Wyświetl timeline kart historii
  return (
    <div className="flex flex-col gap-4">
      {historyEntries.map((entry) => (
        <HistoryCard
          key={entry.id}
          entry={entry}
          onRecipeClick={onRecipeClick}
          onCookAgain={onCookAgain}
          isExpanded={expandedCards.has(entry.id)}
          onToggleExpand={onToggleCardExpansion}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton card dla loading state
 */
function SkeletonCard() {
  return (
    <div className="border rounded-lg p-6 space-y-4 border-l-4 border-l-primary">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

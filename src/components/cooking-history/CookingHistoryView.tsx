import { useEffect, useMemo } from "react";
import { useCookingHistory } from "../../hooks/useCookingHistory";
import { HistoryHeader } from "./HistoryHeader";
import { FilterToolbar } from "./FilterToolbar";
import { HistoryTimeline } from "./HistoryTimeline";
import { PaginationControls } from "./PaginationControls";
import { calculateHistoryStats } from "../../lib/mappers/cooking-history-view.mapper";
import type { CookingHistoryPageProps } from "./types";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Główny komponent widoku Historia Gotowania
 * Zarządza stanem, fetchingiem danych, filtrowaniem oraz wyświetlaniem historii gotowania
 */
export function CookingHistoryView({ initialData }: CookingHistoryPageProps) {
  const {
    historyEntries,
    pagination,
    loading,
    error,
    filters,
    expandedCards,
    setFilters,
    clearFilters,
    setPage,
    toggleCardExpansion,
    refreshList,
  } = useCookingHistory({ initialData });

  // Obliczanie statystyk historii
  const stats = useMemo(() => {
    return calculateHistoryStats(historyEntries);
  }, [historyEntries]);

  // Obsługa nawigacji do przepisu
  const handleRecipeClick = (recipeId: number) => {
    window.location.href = `/recipes/${recipeId}`;
  };

  // Obsługa ponownego gotowania
  const handleCookAgain = (recipeId: number) => {
    window.location.href = `/recipes/${recipeId}`;
  };

  // Scroll do góry przy zmianie strony
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pagination.page]);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Wystąpił błąd</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={refreshList}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <HistoryHeader stats={stats} />

      <FilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={clearFilters}
        availableRecipes={[]} // TODO: Fetch available recipes from API
      />

      <div className="mt-8">
        <HistoryTimeline
          historyEntries={historyEntries}
          loading={loading}
          onRecipeClick={handleRecipeClick}
          onCookAgain={handleCookAgain}
          expandedCards={expandedCards}
          onToggleCardExpansion={toggleCardExpansion}
          showEmptyState={!loading}
        />
      </div>

      {pagination.total_pages > 1 && <PaginationControls pagination={pagination} onPageChange={setPage} />}
    </main>
  );
}

import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { HistoryFilters } from './types';
import type { RecipeReferenceDTO } from '../../types';

interface FilterToolbarProps {
  filters: HistoryFilters;
  onFilterChange: (filters: HistoryFilters) => void;
  onClearFilters: () => void;
  availableRecipes?: RecipeReferenceDTO[];
}

/**
 * Toolbar z narzędziami do filtrowania historii gotowania
 */
export function FilterToolbar({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  availableRecipes = []
}: FilterToolbarProps) {
  const [fromDate, setFromDate] = useState(filters.fromDate || '');
  const [toDate, setToDate] = useState(filters.toDate || '');
  const [dateError, setDateError] = useState<string | null>(null);

  const hasActiveFilters = Object.keys(filters).length > 0;

  const validateAndApplyDateFilter = () => {
    setDateError(null);

    // Sprawdź czy daty są w poprawnym formacie
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (fromDate && !dateRegex.test(fromDate)) {
      setDateError('Nieprawidłowy format daty początkowej (użyj YYYY-MM-DD)');
      return;
    }

    if (toDate && !dateRegex.test(toDate)) {
      setDateError('Nieprawidłowy format daty końcowej (użyj YYYY-MM-DD)');
      return;
    }

    // Sprawdź czy from_date <= to_date
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('Data początkowa musi być wcześniejsza lub równa dacie końcowej');
      return;
    }

    // Zastosuj filtry
    onFilterChange({
      ...filters,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    });
  };

  const handleRecipeFilterChange = (recipeId: number | undefined) => {
    onFilterChange({
      ...filters,
      recipeId
    });
  };

  const removeDateFilter = () => {
    setFromDate('');
    setToDate('');
    setDateError(null);
    const { fromDate: _, toDate: __, ...rest } = filters;
    onFilterChange(rest);
  };

  const removeRecipeFilter = () => {
    const { recipeId: _, ...rest } = filters;
    onFilterChange(rest);
  };

  const handleClearAll = () => {
    setFromDate('');
    setToDate('');
    setDateError(null);
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Filtr po przepisie */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="recipe-filter" className="text-sm font-medium mb-2 block">
            Przepis
          </Label>
          <select
            id="recipe-filter"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={filters.recipeId || ''}
            onChange={(e) => handleRecipeFilterChange(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Wszystkie przepisy</option>
            {availableRecipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filtr daty od */}
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="from-date" className="text-sm font-medium mb-2 block">
            Od daty
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filtr daty do */}
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="to-date" className="text-sm font-medium mb-2 block">
            Do daty
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Przycisk zastosuj filtry daty */}
        {(fromDate || toDate) && (
          <Button 
            onClick={validateAndApplyDateFilter}
            variant="secondary"
            size="default"
          >
            <Filter className="w-4 h-4 mr-2" />
            Zastosuj
          </Button>
        )}
      </div>

      {/* Błąd walidacji */}
      {dateError && (
        <div className="text-sm text-destructive">
          {dateError}
        </div>
      )}

      {/* Aktywne filtry - badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Aktywne filtry:</span>
          
          {filters.recipeId && (
            <Badge variant="secondary" className="gap-1">
              Przepis: {availableRecipes.find(r => r.id === filters.recipeId)?.title || filters.recipeId}
              <button
                onClick={removeRecipeFilter}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Usuń filtr przepisu"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.fromDate || filters.toDate) && (
            <Badge variant="secondary" className="gap-1">
              {filters.fromDate && `Od ${filters.fromDate}`}
              {filters.fromDate && filters.toDate && ' '}
              {filters.toDate && `Do ${filters.toDate}`}
              <button
                onClick={removeDateFilter}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                aria-label="Usuń filtr daty"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
          >
            Wyczyść wszystkie
          </Button>
        </div>
      )}
    </div>
  );
}


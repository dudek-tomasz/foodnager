/**
 * useRecipeList Hook
 * 
 * Custom hook for managing recipe list state, including:
 * - Fetching recipes from API
 * - Search, filter, and sort functionality
 * - Pagination
 * - CRUD operations (delete, refresh)
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  RecipeSummaryDTO,
  RecipesListResponseDTO,
  PaginationMetaDTO,
  ListRecipesQueryDTO,
} from '@/types';
import type {
  SortOption,
  RecipeFilters,
} from '@/components/recipes/types';
import { apiClient } from '@/lib/api-client';

interface UseRecipeListOptions {
  initialData?: RecipesListResponseDTO;
}

interface UseRecipeListReturn {
  // State
  recipes: RecipeSummaryDTO[];
  pagination: PaginationMetaDTO;
  loading: boolean;
  error: string | null;
  search: string;
  sort: SortOption;
  filters: RecipeFilters;
  
  // Actions
  fetchRecipes: () => Promise<void>;
  setSearch: (value: string) => void;
  setSort: (option: SortOption) => void;
  setFilters: (filters: RecipeFilters) => void;
  setPage: (page: number) => void;
  deleteRecipe: (id: number) => Promise<void>;
  refreshList: () => Promise<void>;
}

export function useRecipeList(
  options: UseRecipeListOptions = {}
): UseRecipeListReturn {
  // Data state
  const [recipes, setRecipes] = useState<RecipeSummaryDTO[]>(
    options.initialData?.data || []
  );
  const [pagination, setPagination] = useState<PaginationMetaDTO>(
    options.initialData?.pagination || { 
      page: 1, 
      limit: 20, 
      total: 0, 
      total_pages: 0 
    }
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter/search/sort state
  const [search, setSearchState] = useState('');
  const [sort, setSortState] = useState<SortOption>({ 
    field: 'created_at', 
    order: 'desc' 
  });
  const [filters, setFiltersState] = useState<RecipeFilters>({});

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /**
   * Fetches recipes from API with current filters, search, sort, and pagination
   */
  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params: ListRecipesQueryDTO = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        sort: sort.field,
        order: sort.order,
        source: filters.source,
        difficulty: filters.difficulty,
        tags: filters.tagIds,
        max_cooking_time: filters.maxCookingTime,
      };

      const response = await apiClient.get<RecipesListResponseDTO>(
        '/api/recipes',
        params
      );

      setRecipes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Nie udało się pobrać przepisów. Spróbuj ponownie.';
      setError(errorMessage);
      console.error('Fetch recipes error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, sort, filters]);

  /**
   * Fetch recipes when parameters change
   */
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  /**
   * Sets search query (will be debounced)
   */
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Sets sort option
   */
  const setSort = useCallback((option: SortOption) => {
    setSortState(option);
    // Reset to first page when sorting changes
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Sets filters
   */
  const setFilters = useCallback((newFilters: RecipeFilters) => {
    setFiltersState(newFilters);
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Sets current page
   */
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Deletes a recipe by ID
   */
  const deleteRecipe = useCallback(async (id: number) => {
    try {
      await apiClient.delete(`/api/recipes/${id}`);
      
      // If we deleted the last item on the page (and not on first page),
      // go to previous page
      if (recipes.length === 1 && pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        // Otherwise just refresh the current page
        await fetchRecipes();
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Nie udało się usunąć przepisu';
      throw new Error(errorMessage);
    }
  }, [recipes.length, pagination.page, fetchRecipes]);

  /**
   * Refreshes the recipe list
   */
  const refreshList = useCallback(async () => {
    await fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    pagination,
    loading,
    error,
    search,
    sort,
    filters,
    fetchRecipes,
    setSearch,
    setSort,
    setFilters,
    setPage,
    deleteRecipe,
    refreshList,
  };
}


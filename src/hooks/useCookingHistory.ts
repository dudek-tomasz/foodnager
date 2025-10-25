import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api-client';
import type { 
  CookingHistoryDTO, 
  CookingHistoryListResponseDTO,
  PaginationMetaDTO,
  ListCookingHistoryQueryDTO
} from '../types';
import type { HistoryFilters } from '../components/cooking-history/types';

interface UseCookingHistoryOptions {
  initialData?: CookingHistoryListResponseDTO;
}

interface UseCookingHistoryReturn {
  // Stan
  historyEntries: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;
  expandedCards: Set<number>;
  
  // Akcje
  fetchHistory: () => Promise<void>;
  setFilters: (filters: HistoryFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  toggleCardExpansion: (cardId: number) => void;
  refreshList: () => Promise<void>;
}

/**
 * Custom hook do zarządzania stanem widoku Historia Gotowania
 */
export function useCookingHistory(
  options: UseCookingHistoryOptions = {}
): UseCookingHistoryReturn {
  const [historyEntries, setHistoryEntries] = useState<CookingHistoryDTO[]>(
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<HistoryFilters>({});
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ListCookingHistoryQueryDTO = {
        page: pagination.page,
        limit: pagination.limit,
        recipe_id: filters.recipeId,
        from_date: filters.fromDate,
        to_date: filters.toDate
      };

      const response = await apiClient.get<CookingHistoryListResponseDTO>(
        '/api/cooking-history',
        params
      );

      setHistoryEntries(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Nie udało się pobrać historii gotowania. Spróbuj ponownie.');
      console.error('Fetch cooking history error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch przy zmianie parametrów
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setFilters = (newFilters: HistoryFilters) => {
    setFiltersState(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset do strony 1
  };

  const clearFilters = () => {
    setFiltersState({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const toggleCardExpansion = (cardId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const refreshList = async () => {
    await fetchHistory();
  };

  return {
    historyEntries,
    pagination,
    loading,
    error,
    filters,
    expandedCards,
    fetchHistory,
    setFilters,
    clearFilters,
    setPage,
    toggleCardExpansion,
    refreshList
  };
}


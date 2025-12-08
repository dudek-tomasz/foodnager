/**
 * Custom hook zarządzający stanem i logiką widoku lodówki
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  FridgeViewState,
  FridgeItemDTO,
  FridgeListResponseDTO,
  ListFridgeQueryDTO,
  SortField,
  SortOrderEnum,
} from "@/types";

/**
 * Initial state dla widoku lodówki
 */
const initialState: FridgeViewState = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  searchQuery: "",
  sortBy: "created_at",
  sortOrder: "desc",
  expiredFilter: "all",
  expiringSoonDays: undefined,
  isLoading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  editingItem: null,
  isConfirmDialogOpen: false,
  deletingItemId: null,
  deletingItemName: null,
  stats: { totalCount: 0, expiredCount: 0 },
};

/**
 * Custom hook zarządzający stanem i logiką widoku lodówki
 */
export function useFridge() {
  const [state, setState] = useState<FridgeViewState>(initialState);
  const isInitialMount = useRef(true);

  /**
   * Fetch items from API
   */
  const fetchItems = useCallback(
    async (overrideParams?: Partial<ListFridgeQueryDTO>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params: Record<string, string> = {
          page: String(overrideParams?.page ?? state.pagination.page),
          limit: String(overrideParams?.limit ?? state.pagination.limit),
          sort: overrideParams?.sort ?? state.sortBy,
          order: overrideParams?.order ?? state.sortOrder,
        };

        // Add optional filters
        if (state.searchQuery) {
          params.search = state.searchQuery;
        }
        if (state.expiredFilter !== "all") {
          params.expired = state.expiredFilter;
        }
        if (state.expiringSoonDays !== undefined) {
          params.expiring_soon = String(state.expiringSoonDays);
        }

        const queryParams = new URLSearchParams(params);
        const response = await fetch(`/api/fridge?${queryParams}`);

        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const data: FridgeListResponseDTO = await response.json();

        // Calculate stats
        const expiredCount = data.data.filter((item) => {
          if (!item.expiry_date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiryDate = new Date(item.expiry_date);
          expiryDate.setHours(0, 0, 0, 0);
          return expiryDate < today;
        }).length;

        setState((prev) => ({
          ...prev,
          items: data.data,
          pagination: data.pagination,
          stats: {
            totalCount: data.pagination.total,
            expiredCount,
          },
          isLoading: false,
        }));
      } catch (error) {
        // Error fetching items - log to monitoring service in production
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch items:", error);
        }
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Nie udało się pobrać produktów",
        }));
      }
    },
    [
      state.pagination.page,
      state.pagination.limit,
      state.sortBy,
      state.sortOrder,
      state.searchQuery,
      state.expiredFilter,
      state.expiringSoonDays,
    ]
  );

  /**
   * Initial fetch on mount and when filters change
   */
  useEffect(() => {
    // Initial fetch - no debounce
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchItems();
      return;
    }

    // Subsequent fetches - with debounce
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchItems, state.searchQuery, state.sortBy, state.sortOrder, state.expiredFilter, state.expiringSoonDays]);

  /**
   * Handle search query change
   */
  const handleSearchChange = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
      pagination: { ...prev.pagination, page: 1 },
    }));
    // Fetch will be triggered by useEffect watching searchQuery
  }, []);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((sortBy: SortField, order: SortOrderEnum) => {
    setState((prev) => ({ ...prev, sortBy, sortOrder: order }));
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page } }));
      fetchItems({ page });
    },
    [fetchItems]
  );

  /**
   * Modal handlers
   */
  const openAddModal = useCallback(() => {
    setState((prev) => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const closeAddModal = useCallback(() => {
    setState((prev) => ({ ...prev, isAddModalOpen: false }));
  }, []);

  const openEditModal = useCallback((item: FridgeItemDTO) => {
    setState((prev) => ({ ...prev, isEditModalOpen: true, editingItem: item }));
  }, []);

  const closeEditModal = useCallback(() => {
    setState((prev) => ({ ...prev, isEditModalOpen: false, editingItem: null }));
  }, []);

  const openDeleteConfirm = useCallback((itemId: number, itemName: string) => {
    setState((prev) => ({
      ...prev,
      isConfirmDialogOpen: true,
      deletingItemId: itemId,
      deletingItemName: itemName,
    }));
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConfirmDialogOpen: false,
      deletingItemId: null,
      deletingItemName: null,
    }));
  }, []);

  /**
   * Success handlers (trigger refetch)
   */
  const handleAddSuccess = useCallback(
    async (addAnother: boolean) => {
      await fetchItems();
      if (!addAnother) {
        closeAddModal();
      }
    },
    [fetchItems, closeAddModal]
  );

  const handleEditSuccess = useCallback(async () => {
    await fetchItems();
    closeEditModal();
  }, [fetchItems, closeEditModal]);

  /**
   * Delete handler
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!state.deletingItemId) return;

    try {
      const response = await fetch(`/api/fridge/${state.deletingItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      await fetchItems();
      closeDeleteConfirm();
    } catch (error) {
      // Error deleting item - log to monitoring service in production
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete item:", error);
      }
      // Error will be shown via toast in component
    }
  }, [state.deletingItemId, fetchItems, closeDeleteConfirm]);

  return {
    state,
    handlers: {
      handleSearchChange,
      handleSortChange,
      handlePageChange,
      openAddModal,
      closeAddModal,
      openEditModal,
      closeEditModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      handleAddSuccess,
      handleEditSuccess,
      handleDeleteConfirm,
      refetch: fetchItems,
    },
  };
}

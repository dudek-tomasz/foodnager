/**
 * FridgeView - Main component for the Virtual Fridge view
 * 
 * This component manages the entire fridge view, including:
 * - Listing fridge items with filtering and sorting
 * - Adding new products to the fridge
 * - Editing existing fridge items
 * - Deleting items from the fridge
 * - Handling all user interactions and API communication
 */

import React from 'react';
import { toast } from 'sonner';
import { useFridge } from './hooks/useFridge';
import FridgeToolbar from './FridgeToolbar';
import FridgeStats from './FridgeStats';
import EmptyState from './EmptyState';
import FridgeList from './FridgeList';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import ConfirmDialog from './ConfirmDialog';

export default function FridgeView() {
  const { state, handlers } = useFridge();

  // Wrapped handlers with toast notifications
  const handleAddSuccess = (addAnother: boolean) => {
    handlers.handleAddSuccess(addAnother);
    toast.success('Produkt dodany pomyślnie');
  };

  const handleEditSuccess = () => {
    handlers.handleEditSuccess();
    toast.success('Produkt zaktualizowany pomyślnie');
  };

  const handleDeleteConfirm = async () => {
    try {
      await handlers.handleDeleteConfirm();
      toast.success('Produkt usunięty pomyślnie');
    } catch (error) {
      toast.error('Nie udało się usunąć produktu');
    }
  };

  const handleRetry = () => {
    handlers.refetch();
    toast.loading('Ponowne pobieranie danych...');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Twoja lodówka
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Zarządzaj produktami w swojej wirtualnej lodówce
        </p>
      </header>

      {/* Toolbar with search, sort, and add button */}
      <FridgeToolbar
        searchQuery={state.searchQuery}
        onSearchChange={handlers.handleSearchChange}
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSortChange={handlers.handleSortChange}
        onAddProduct={handlers.openAddModal}
      />

      {/* Stats */}
      <FridgeStats
        totalCount={state.stats.totalCount}
        expiredCount={state.stats.expiredCount}
      />

      {/* Loading state */}
      {state.isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Ładowanie produktów...</p>
        </div>
      )}

      {/* Error state */}
      {state.error && !state.isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-800 dark:text-red-200">{state.error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Empty state */}
      {!state.isLoading && !state.error && state.items.length === 0 && (
        <EmptyState onAddFirst={handlers.openAddModal} />
      )}

      {/* List */}
      {!state.isLoading && !state.error && state.items.length > 0 && (
        <FridgeList
          items={state.items}
          isLoading={state.isLoading}
          pagination={state.pagination}
          onEdit={(itemId) => {
            const item = state.items.find((i) => i.id === itemId);
            if (item) {
              handlers.openEditModal(item);
            }
          }}
          onDelete={(itemId) => {
            const item = state.items.find((i) => i.id === itemId);
            if (item) {
              handlers.openDeleteConfirm(itemId, item.product.name);
            }
          }}
          onPageChange={handlers.handlePageChange}
        />
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={state.isAddModalOpen}
        onClose={handlers.closeAddModal}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={state.isEditModalOpen}
        item={state.editingItem}
        onClose={handlers.closeEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={state.isConfirmDialogOpen}
        title="Usunąć produkt?"
        description={
          state.deletingItemName
            ? `Czy na pewno chcesz usunąć "${state.deletingItemName}"? Ta operacja jest nieodwracalna.`
            : 'Czy na pewno chcesz usunąć ten produkt? Ta operacja jest nieodwracalna.'
        }
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        onConfirm={handleDeleteConfirm}
        onCancel={handlers.closeDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
}


/**
 * RecipeListView Component
 * 
 * Main view component for recipe list page.
 * Manages state, integrates all subcomponents, and handles user interactions.
 * 
 * Features:
 * - Recipe list with search, filter, sort, pagination
 * - Add/Edit/Delete recipe functionality
 * - Recipe statistics
 * - Navigation to recipe details
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useRecipeList } from '@/hooks/useRecipeList';
import { RecipeDetailsModal } from '@/components/recipe-details';
import { RecipeListHeader } from './RecipeListHeader';
import { RecipeToolbar } from './RecipeToolbar';
import { RecipeGrid } from './RecipeGrid';
import { PaginationControls } from './PaginationControls';
import { RecipeFormModal } from './RecipeFormModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { calculateRecipeStats } from '@/lib/mappers/recipe-view.mapper';
import type { RecipesPageProps } from './types';
import type { RecipeSummaryDTO, TagDTO, RecipeDTO } from '@/types';

interface RecipeListViewProps extends RecipesPageProps {
  initialTags?: TagDTO[];
  initialUnits?: any[]; // UnitDTO
}

export function RecipeListView({
  initialData,
  initialTags = [],
  initialUnits = [],
}: RecipeListViewProps) {
  // Recipe list state management
  const {
    recipes,
    pagination,
    loading,
    error,
    search,
    sort,
    filters,
    setSearch,
    setSort,
    setFilters,
    setPage,
    deleteRecipe,
    refreshList,
  } = useRecipeList({ initialData });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingRecipe, setEditingRecipe] = useState<RecipeSummaryDTO | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Recipe details modal state
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Calculate statistics
  const stats = calculateRecipeStats(recipes);

  /**
   * Opens add recipe modal
   */
  const handleAddRecipe = () => {
    setModalMode('add');
    setEditingRecipe(null);
    setIsModalOpen(true);
  };

  /**
   * Opens edit recipe modal
   */
  const handleEditRecipe = (recipe: RecipeSummaryDTO) => {
    setModalMode('edit');
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  /**
   * Opens delete confirmation dialog
   */
  const handleDeleteRecipe = (id: number) => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
      setRecipeToDelete({ id: recipe.id, name: recipe.title });
      setIsDeleteDialogOpen(true);
    }
  };

  /**
   * Confirms and executes recipe deletion
   */
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      await deleteRecipe(recipeToDelete.id);
      toast.success('Przepis został usunięty');
      setIsDeleteDialogOpen(false);
      setRecipeToDelete(null);
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się usunąć przepisu';
      toast.error(errorMessage);
    }
  };

  /**
   * Cancels recipe deletion
   */
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setRecipeToDelete(null);
  };

  /**
   * Handles successful recipe save (add or edit)
   */
  const handleRecipeSaveSuccess = async (recipe: RecipeDTO) => {
    await refreshList();
  };

  /**
   * Closes recipe form modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  /**
   * Opens recipe details modal
   */
  const handleRecipeClick = (id: number) => {
    setSelectedRecipeId(id);
    setIsDetailsModalOpen(true);
  };

  /**
   * Closes recipe details modal
   */
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRecipeId(null);
    // Refresh list in case recipe was deleted or saved from modal
    refreshList();
  };

  /**
   * Handles "Cook" action - creates cooking history
   */
  const handleCookRecipe = async (id: number) => {
    try {
      const response = await fetch('/api/cooking-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipe_id: id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create cooking history');
      }

      toast.success('Przepis został ugotowany! Składniki zostały odjęte z lodówki.');
      
      // Optionally navigate to cooking history or recipe details
      // window.location.href = '/cooking-history';
    } catch (err) {
      console.error('Failed to cook recipe:', err);
      toast.error('Nie udało się ugotować przepisu. Sprawdź czy masz wystarczającą ilość składników.');
    }
  };

  // Error state
  if (error && !loading && recipes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Wystąpił błąd
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-6">
            {error}
          </p>
          <button
            onClick={() => refreshList()}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8" role="main" aria-label="Lista przepisów">
      {/* Header with statistics and add button */}
      <RecipeListHeader
        stats={stats}
        onAddRecipe={handleAddRecipe}
      />

      {/* Toolbar with search, sort, and filters */}
      <RecipeToolbar
        searchValue={search}
        sortOption={sort}
        filters={filters}
        availableTags={initialTags}
        loading={loading}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onFilterChange={setFilters}
        onAddRecipe={handleAddRecipe}
      />

      {/* Recipe grid */}
      <RecipeGrid
        recipes={recipes}
        loading={loading}
        searchQuery={search}
        onRecipeClick={handleRecipeClick}
        onCookRecipe={handleCookRecipe}
        onEditRecipe={handleEditRecipe}
        onDeleteRecipe={handleDeleteRecipe}
        onAddRecipe={handleAddRecipe}
      />

      {/* Pagination controls */}
      {!loading && recipes.length > 0 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      {/* Recipe Form Modal (Add/Edit) */}
      <RecipeFormModal
        mode={modalMode}
        recipe={editingRecipe || undefined}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleRecipeSaveSuccess}
        availableTags={initialTags}
        availableUnits={initialUnits}
      />

      {/* Delete Confirmation Dialog */}
      {recipeToDelete && (
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          recipeName={recipeToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Recipe Details Modal */}
      {selectedRecipeId && (
        <RecipeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          recipeId={selectedRecipeId}
          from="recipes"
        />
      )}
    </main>
  );
}


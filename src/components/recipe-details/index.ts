/**
 * Recipe Details components - Main exports
 */

export { default as RecipeDetailsView } from './RecipeDetailsView';
export { default as RecipeDetailsModal } from './RecipeDetailsModal';

// Subcomponents (optional exports for external use)
export { default as RecipeHeader } from './RecipeHeader';
export { default as RecipeMetaSection } from './RecipeMetaSection';
export { default as RecipeIngredientsSection } from './RecipeIngredientsSection';
export { default as RecipeInstructionsSection } from './RecipeInstructionsSection';
export { default as StickyBottomBar } from './StickyBottomBar';

// Atomic components
export { default as BackButton } from './BackButton';
export { default as SourceBadge } from './SourceBadge';
export { default as MatchScoreBadge } from './MatchScoreBadge';
export { default as TagBadge } from './TagBadge';
export { default as MetaItem } from './MetaItem';
export { default as IngredientItem } from './IngredientItem';
export { default as InstructionStep } from './InstructionStep';

// Composite components
export { default as RecipeActionsDropdown } from './RecipeActionsDropdown';
export { default as IngredientsList } from './IngredientsList';
export { default as IngredientsDeductionPreview } from './IngredientsDeductionPreview';

// Dialogs
export { default as CookConfirmationDialog } from './dialogs/CookConfirmationDialog';
export { default as DeleteConfirmationDialog } from './dialogs/DeleteConfirmationDialog';

// Hooks
export { useRecipeDetails } from './hooks/useRecipeDetails';
export { useScrollVisibility } from './hooks/useScrollVisibility';

// Types
export type { RecipeDetailsViewProps } from './RecipeDetailsView';
export type { RecipeDetailsModalProps } from './RecipeDetailsModal';


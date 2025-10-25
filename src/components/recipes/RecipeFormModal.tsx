/**
 * RecipeFormModal Component
 * 
 * Modal for creating and editing recipes.
 * Full-screen on mobile, 600px centered on desktop.
 * 
 * Sections:
 * 1. Basic info (title, description)
 * 2. Ingredients (dynamic list) - see RecipeIngredientsSection
 * 3. Instructions
 * 4. Meta (cooking time, difficulty, tags)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RecipeIngredientsSection } from './RecipeIngredientsSection';
import type {
  RecipeFormData,
  RecipeFormErrors,
  RecipeIngredientFormData,
} from './types';
import type { RecipeSummaryDTO, TagDTO, UnitDTO, RecipeDTO, DifficultyEnum } from '@/types';
import { apiClient } from '@/lib/api-client';
import {
  mapRecipeFormDataToCreateDTO,
  mapRecipeFormDataToUpdateDTO,
  mapRecipeDTOToFormData,
  createEmptyRecipeFormData,
  createEmptyIngredientFormData,
} from '@/lib/mappers/recipe-view.mapper';

interface RecipeFormModalProps {
  mode: 'add' | 'edit';
  recipe?: RecipeSummaryDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipe: RecipeDTO) => void;
  availableTags: TagDTO[];
  availableUnits: UnitDTO[];
}

const DIFFICULTY_OPTIONS: { value: DifficultyEnum; label: string }[] = [
  { value: 'easy', label: 'Łatwy' },
  { value: 'medium', label: 'Średni' },
  { value: 'hard', label: 'Trudny' },
];

export function RecipeFormModal({
  mode,
  recipe,
  isOpen,
  onClose,
  onSuccess,
  availableTags,
  availableUnits,
}: RecipeFormModalProps) {
  // Form state
  const [formData, setFormData] = useState<RecipeFormData>(createEmptyRecipeFormData());
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [loading, setLoading] = useState(false);

  // Initialize form with recipe data when editing
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && recipe) {
        setFormData(mapRecipeDTOToFormData(recipe));
      } else {
        // For new recipes, start with one empty ingredient
        const emptyFormData = createEmptyRecipeFormData();
        emptyFormData.ingredients = [createEmptyIngredientFormData()];
        setFormData(emptyFormData);
      }
      setErrors({});
    }
  }, [isOpen, mode, recipe]);

  /**
   * Validates the entire form
   */
  const validateForm = (): boolean => {
    const newErrors: RecipeFormErrors = {};

    // Title validation
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Tytuł jest wymagany';
    } else if (trimmedTitle.length > 100) {
      newErrors.title = 'Tytuł może mieć max 100 znaków';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Opis może mieć max 500 znaków';
    }

    // Instructions validation
    const trimmedInstructions = formData.instructions.trim();
    if (!trimmedInstructions) {
      newErrors.instructions = 'Instrukcje są wymagane';
    } else if (trimmedInstructions.length < 10) {
      newErrors.instructions = 'Instrukcje muszą mieć minimum 10 znaków';
    } else if (trimmedInstructions.length > 5000) {
      newErrors.instructions = 'Instrukcje mogą mieć max 5000 znaków';
    }

    // Ingredients validation
    if (formData.ingredients.length === 0) {
      toast.error('Dodaj przynajmniej jeden składnik');
      return false;
    }

    // Validate each ingredient
    const ingredientErrors: RecipeFormErrors['ingredients'] = {};
    let hasIngredientErrors = false;

    formData.ingredients.forEach((ingredient, index) => {
      const errors: { productId?: string; quantity?: string; unitId?: string } = {};

      if (!ingredient.productId) {
        errors.productId = 'Wybierz produkt';
        hasIngredientErrors = true;
      }

      if (ingredient.quantity <= 0) {
        errors.quantity = 'Ilość musi być większa od 0';
        hasIngredientErrors = true;
      }

      if (!ingredient.unitId) {
        errors.unitId = 'Wybierz jednostkę';
        hasIngredientErrors = true;
      }

      if (Object.keys(errors).length > 0) {
        ingredientErrors[index] = errors;
      }
    });

    if (hasIngredientErrors) {
      newErrors.ingredients = ingredientErrors;
      toast.error('Uzupełnij wszystkie pola składników');
    }

    // Check for duplicate products
    const productIds = formData.ingredients
      .map(ing => ing.productId)
      .filter((id): id is number => id !== null);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      toast.error('Usunięto duplikaty produktów ze składników');
      return false;
    }

    // Cooking time validation
    if (formData.cookingTime !== null && formData.cookingTime <= 0) {
      newErrors.cookingTime = 'Czas gotowania musi być większy od 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let savedRecipe: RecipeDTO;

      if (mode === 'add') {
        const createDTO = mapRecipeFormDataToCreateDTO(formData);
        savedRecipe = await apiClient.post<RecipeDTO>('/api/recipes', createDTO);
        toast.success('Przepis został dodany');
      } else {
        const updateDTO = mapRecipeFormDataToUpdateDTO(formData);
        savedRecipe = await apiClient.patch<RecipeDTO>(
          `/api/recipes/${recipe!.id}`,
          updateDTO
        );
        toast.success('Przepis został zaktualizowany');
      }

      onSuccess(savedRecipe);
      onClose();
    } catch (error) {
      console.error('Failed to save recipe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nie udało się zapisać przepisu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles tag selection toggle
   */
  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="recipe-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Dodaj przepis' : 'Edytuj przepis'}
          </DialogTitle>
          <p id="recipe-form-description" className="sr-only">
            Formularz {mode === 'add' ? 'dodawania nowego' : 'edycji'} przepisu. 
            Wypełnij wymagane pola: tytuł, składniki i instrukcje.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Formularz przepisu">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tytuł <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onBlur={() => {
                  if (!formData.title.trim()) {
                    setErrors({ ...errors, title: 'Tytuł jest wymagany' });
                  } else {
                    const { title, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
                placeholder="np. Zupa pomidorowa"
                maxLength={100}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis (opcjonalnie)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Krótki opis przepisu..."
                maxLength={500}
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              <div className="flex justify-between items-center">
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
                <p className="text-sm text-neutral-500 ml-auto">
                  {formData.description.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Ingredients */}
          <RecipeIngredientsSection
            ingredients={formData.ingredients}
            availableUnits={availableUnits}
            onChange={(ingredients) => setFormData({ ...formData, ingredients })}
          />

          {/* Section 3: Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              Instrukcje <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              onBlur={() => {
                const trimmed = formData.instructions.trim();
                if (!trimmed) {
                  setErrors({ ...errors, instructions: 'Instrukcje są wymagane' });
                } else if (trimmed.length < 10) {
                  setErrors({ ...errors, instructions: 'Instrukcje muszą mieć minimum 10 znaków' });
                } else {
                  const { instructions, ...rest } = errors;
                  setErrors(rest);
                }
              }}
              placeholder="1. Pokrój warzywa...&#10;2. Ugotuj...&#10;3. Podawaj ciepłe..."
              maxLength={5000}
              rows={8}
              className={errors.instructions ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center">
              {errors.instructions && (
                <p className="text-sm text-red-500">{errors.instructions}</p>
              )}
              <p className="text-sm text-neutral-500 ml-auto">
                {formData.instructions.length}/5000
              </p>
            </div>
          </div>

          {/* Section 4: Meta */}
          <div className="space-y-4">
            {/* Cooking Time */}
            <div className="space-y-2">
              <Label htmlFor="cookingTime">Czas gotowania (minuty)</Label>
              <Input
                id="cookingTime"
                type="number"
                min="1"
                value={formData.cookingTime || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ ...formData, cookingTime: value });
                }}
                placeholder="np. 30"
                className={errors.cookingTime ? 'border-red-500' : ''}
              />
              {errors.cookingTime && (
                <p className="text-sm text-red-500">{errors.cookingTime}</p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Trudność</Label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.difficulty === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, difficulty: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
                {formData.difficulty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, difficulty: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tagi</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={formData.tagIds.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with buttons */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'add' ? 'Dodaj przepis' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


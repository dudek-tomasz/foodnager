/**
 * FilterMultiSelect Component
 *
 * Multi-select dropdown for filtering recipes by:
 * - Source (USER, API, AI)
 * - Difficulty (easy, medium, hard)
 * - Tags
 * - Max cooking time
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import type { RecipeFilters } from "./types";
import type { TagDTO, SourceEnum, DifficultyEnum } from "@/types";

interface FilterMultiSelectProps {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
  availableTags: TagDTO[];
}

const SOURCE_OPTIONS: { value: SourceEnum; label: string }[] = [
  { value: "user", label: "Moje przepisy" },
  { value: "api", label: "Z API" },
  { value: "ai", label: "Generowane AI" },
];

const DIFFICULTY_OPTIONS: { value: DifficultyEnum; label: string }[] = [
  { value: "easy", label: "Łatwy" },
  { value: "medium", label: "Średni" },
  { value: "hard", label: "Trudny" },
];

export function FilterMultiSelect({ filters, onChange, availableTags }: FilterMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    filters.source ? 1 : 0,
    filters.difficulty ? 1 : 0,
    filters.tagIds?.length || 0,
    filters.maxCookingTime ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  const handleSourceChange = (source: SourceEnum) => {
    onChange({
      ...filters,
      source: filters.source === source ? undefined : source,
    });
  };

  const handleDifficultyChange = (difficulty: DifficultyEnum) => {
    onChange({
      ...filters,
      difficulty: filters.difficulty === difficulty ? undefined : difficulty,
    });
  };

  const handleTagToggle = (tagId: number) => {
    const currentTags = filters.tagIds || [];
    const newTags = currentTags.includes(tagId) ? currentTags.filter((id) => id !== tagId) : [...currentTags, tagId];

    onChange({
      ...filters,
      tagIds: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleMaxCookingTimeChange = (value: string) => {
    const numValue = parseInt(value);
    onChange({
      ...filters,
      maxCookingTime: numValue > 0 ? numValue : undefined,
    });
  };

  const clearAllFilters = () => {
    onChange({});
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtruj
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-2 px-1.5 py-0 h-5 min-w-[1.25rem] rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* Header with Clear All */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtry</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
                Wyczyść wszystkie
              </Button>
            )}
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Źródło</Label>
            <div className="space-y-2">
              {SOURCE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${option.value}`}
                    checked={filters.source === option.value}
                    onCheckedChange={() => handleSourceChange(option.value)}
                  />
                  <label htmlFor={`source-${option.value}`} className="text-sm leading-none cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Trudność</Label>
            <div className="space-y-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`difficulty-${option.value}`}
                    checked={filters.difficulty === option.value}
                    onCheckedChange={() => handleDifficultyChange(option.value)}
                  />
                  <label htmlFor={`difficulty-${option.value}`} className="text-sm leading-none cursor-pointer">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Tagi</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={filters.tagIds?.includes(tag.id) || false}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <label htmlFor={`tag-${tag.id}`} className="text-sm leading-none cursor-pointer">
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Max Cooking Time Filter */}
          <div className="space-y-2">
            <Label
              htmlFor="max-cooking-time"
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase"
            >
              Max czas gotowania (min)
            </Label>
            <Input
              id="max-cooking-time"
              type="number"
              min="0"
              value={filters.maxCookingTime || ""}
              onChange={(e) => handleMaxCookingTimeChange(e.target.value)}
              placeholder="np. 30"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

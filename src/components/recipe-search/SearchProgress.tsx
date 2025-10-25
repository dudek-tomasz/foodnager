/**
 * SearchProgress - Shows current search progress
 * 
 * Displays animated spinner and current search source
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { RecipeSource } from '@/types/recipe-search.types';

interface SearchProgressProps {
  currentSource: RecipeSource;
}

const sourceLabels: Record<RecipeSource, string> = {
  user: 'Moich przepisach',
  api: 'API przepisów',
  ai: 'Generowaniu przez AI',
  all: 'Wszystkich źródłach',
};

export default function SearchProgress({ currentSource }: SearchProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 mb-8">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
      <p className="text-lg font-medium text-gray-900" aria-live="polite">
        Szukam w: <span className="text-blue-600">{sourceLabels[currentSource]}</span>
      </p>
    </div>
  );
}


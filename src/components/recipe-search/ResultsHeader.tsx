/**
 * ResultsHeader - Header for search results view
 * 
 * Displays title and back button to return to source selection
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecipeSource } from '@/types/recipe-search.types';

interface ResultsHeaderProps {
  source: RecipeSource;
  onBack: () => void;
}

const sourceTitles: Record<RecipeSource, string> = {
  user: 'Moje przepisy',
  api: 'API przepisów',
  ai: 'AI',
  all: 'Wszystkie źródła',
};

export default function ResultsHeader({ source, onBack }: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 gap-2 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do wyboru źródła
      </Button>
      
      <h1 className="text-3xl font-bold text-gray-900">
        Wyniki wyszukiwania: <span className="text-blue-600">{sourceTitles[source]}</span>
      </h1>
    </div>
  );
}


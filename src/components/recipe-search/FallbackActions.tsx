/**
 * FallbackActions - Action buttons for empty search results
 * 
 * Provides options to go back or generate with AI
 */

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecipeSource } from '@/types/recipe-search.types';

interface FallbackActionsProps {
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
}

export default function FallbackActions({ source, onBack, onGenerateAI }: FallbackActionsProps) {
  // Hide "Generate AI" button if we already tried AI
  const showAIButton = source !== 'ai';

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
      <Button
        variant="outline"
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Wróć do wyboru źródła
      </Button>

      {showAIButton && (
        <Button
          variant="default"
          onClick={onGenerateAI}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Sparkles className="h-4 w-4" />
          Generuj przepis z AI
        </Button>
      )}
    </div>
  );
}


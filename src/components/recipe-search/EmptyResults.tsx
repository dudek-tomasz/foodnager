/**
 * EmptyResults - Component displayed when search returns no results
 * 
 * Shows message with suggestions and action buttons
 */

import React from 'react';
import type { RecipeSource } from '@/types/recipe-search.types';
import EmptyStateMessage from './EmptyStateMessage';
import FallbackActions from './FallbackActions';

interface EmptyResultsProps {
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
}

export default function EmptyResults({ source, onBack, onGenerateAI }: EmptyResultsProps) {
  return (
    <div className="py-8">
      <EmptyStateMessage />
      <FallbackActions
        source={source}
        onBack={onBack}
        onGenerateAI={onGenerateAI}
      />
    </div>
  );
}


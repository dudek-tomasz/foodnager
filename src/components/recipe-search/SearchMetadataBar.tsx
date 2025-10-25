/**
 * SearchMetadataBar - Displays search metadata information
 * 
 * Shows source, number of results, and search duration
 */

import React from 'react';
import { BookOpen, Globe, Sparkles, Search, Clock } from 'lucide-react';
import type { SearchMetadataDTO } from '@/types/recipe-search.types';

interface SearchMetadataBarProps {
  metadata: SearchMetadataDTO;
}

const sourceIcons = {
  user_recipes: BookOpen,
  external_api: Globe,
  ai_generated: Sparkles,
};

const sourceLabels = {
  user_recipes: 'Moje przepisy',
  external_api: 'API przepisów',
  ai_generated: 'AI',
};

export default function SearchMetadataBar({ metadata }: SearchMetadataBarProps) {
  const IconComponent = sourceIcons[metadata.source] || Search;
  const sourceLabel = sourceLabels[metadata.source] || metadata.source;

  return (
    <div className="flex items-center gap-4 p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
      <IconComponent className="h-5 w-5 text-gray-600 flex-shrink-0" />
      
      <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-900 font-medium">
          Znaleziono <span className="font-bold">{metadata.total_results}</span>{' '}
          {metadata.total_results === 1 
            ? 'przepis' 
            : metadata.total_results < 5 
            ? 'przepisy' 
            : 'przepisów'}
        </span>
        <span className="text-gray-500">z</span>
        <span className="text-gray-900 font-medium">{sourceLabel}</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Clock className="h-4 w-4" />
        <span>{metadata.search_duration_ms}ms</span>
      </div>
    </div>
  );
}


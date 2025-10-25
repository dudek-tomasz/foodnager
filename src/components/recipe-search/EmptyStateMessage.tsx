/**
 * EmptyStateMessage - Message displayed when no results found
 * 
 * Shows suggestions for what user can do next
 */

import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyStateMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <SearchX className="h-24 w-24 text-gray-400 mb-6" strokeWidth={1.5} />
      
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Nie znaleziono przepisów
      </h2>
      
      <div className="max-w-md space-y-2 text-gray-600">
        <p>Spróbuj następujących rzeczy:</p>
        <ul className="text-left space-y-1.5 mt-4">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Dodaj więcej produktów do swojej lodówki</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Wybierz inne źródło wyszukiwania</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Wygeneruj przepis za pomocą AI</span>
          </li>
        </ul>
      </div>
    </div>
  );
}


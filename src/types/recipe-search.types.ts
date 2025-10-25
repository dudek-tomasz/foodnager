/**
 * Types and ViewModels for Recipe Search View
 * 
 * This file contains type definitions specific to the recipe search functionality,
 * complementing the base DTO types from types.ts
 */

import type {
  RecipeSearchResultDTO,
  SearchMetadataDTO,
  SearchRecipesByFridgeDTO,
  GenerateRecipeDTO,
} from '../types';

// =============================================================================
// ENUMS AND BASE TYPES
// =============================================================================

/**
 * Enum reprezentujący źródła przepisów do wyboru
 */
export type RecipeSource = 'user' | 'api' | 'ai' | 'all';

/**
 * Stan widoku wyszukiwania
 */
export type SearchViewStep = 'source_selection' | 'loading' | 'results';

// =============================================================================
// VIEW STATE
// =============================================================================

/**
 * Stan całego widoku wyszukiwania przepisów
 */
export interface RecipeSearchViewState {
  step: SearchViewStep;
  source: RecipeSource | null;
  isLoading: boolean;
  searchStartTime: number | null; // timestamp
  searchDuration: number; // ms
  results: RecipeSearchResultDTO[] | null;
  searchMetadata: SearchMetadataDTO | null;
  error: SearchError | null;
  abortController: AbortController | null;
}

/**
 * Błąd wyszukiwania
 */
export interface SearchError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// COMPONENT PROPS AND DATA
// =============================================================================

/**
 * Dane kafelka źródła
 */
export interface SourceCardData {
  source: RecipeSource;
  title: string;
  description: string;
  icon: string; // nazwa ikony lucide-react
  badge?: number; // liczba przepisów (tylko dla 'user')
}

/**
 * Stan lodówki (do przekazania z SSR)
 */
export interface FridgeStatus {
  itemCount: number;
  isEmpty: boolean;
}

/**
 * Wynik formatowania match score dla UI
 */
export interface FormattedMatchScore {
  percentage: number; // 0-100
  label: string; // "95%"
  colorClass: string; // "text-green-600", "text-yellow-600", "text-red-600"
  borderClass: string; // "border-green-500", etc.
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Hook return type dla useRecipeSearch
 */
export interface UseRecipeSearchReturn {
  state: RecipeSearchViewState;
  actions: {
    selectSource: (source: RecipeSource) => Promise<void>;
    cancelSearch: () => void;
    retrySearch: () => Promise<void>;
    generateWithAI: () => Promise<void>;
    goBack: () => void;
  };
  helpers: {
    formatMatchScore: (score: number) => FormattedMatchScore;
    getSourceLabel: (source: RecipeSource) => string;
    isSearchTimedOut: () => boolean;
  };
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Konfiguracja źródeł przepisów
 */
export const RECIPE_SOURCES: SourceCardData[] = [
  {
    source: 'user',
    title: 'Moje przepisy',
    description: 'Przeszukuj swoje zapisane przepisy',
    icon: 'BookOpen',
  },
  {
    source: 'api',
    title: 'API przepisów',
    description: 'Szukaj w bazie przepisów online',
    icon: 'Globe',
  },
  {
    source: 'ai',
    title: 'Generuj AI',
    description: 'Wygeneruj nowy przepis za pomocą AI',
    icon: 'Sparkles',
  },
  {
    source: 'all',
    title: 'Wszystkie źródła',
    description: 'Przeszukaj wszystkie dostępne źródła',
    icon: 'Search',
  },
];

/**
 * Timeouty dla wyszukiwania
 */
export const SEARCH_TIMEOUTS = {
  WARNING_THRESHOLD: 30000, // 30s - pokaż timeout warning
  MAX_DURATION: 45000, // 45s - maksymalny czas wyszukiwania
} as const;

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export type {
  RecipeSearchResultDTO,
  SearchMetadataDTO,
  SearchRecipesByFridgeDTO,
  GenerateRecipeDTO,
} from '../types';


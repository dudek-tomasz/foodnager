/**
 * Custom hook for product autocomplete functionality
 */

import { useState, useEffect, useCallback } from 'react';
import type { ProductDTO, ProductsListResponseDTO } from '@/types';

/**
 * Hook do obsługi autocomplete produktów
 * 
 * @returns Query, setQuery, results, isLoading
 */
export function useProductAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch products when debounced query changes
  useEffect(() => {
    async function fetchProducts() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedQuery,
          scope: 'all',
          limit: '10',
        });

        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: ProductsListResponseDTO = await response.json();
        setResults(data.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [debouncedQuery]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { 
    query, 
    setQuery, 
    results, 
    isLoading,
    clearResults,
  };
}


/**
 * Hash Utilities
 * 
 * Provides hashing functions for generating cache keys.
 * Used primarily for caching recipe search and AI generation results.
 */

import type { SearchRecipePreferencesDTO, GenerateRecipePreferencesDTO } from '@/types';

/**
 * Simple hash function for strings (djb2 algorithm)
 * 
 * This is a fast, simple hash function suitable for cache keys.
 * Not cryptographically secure, but perfect for our use case.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  // Convert to unsigned 32-bit integer and then to hex string
  return (hash >>> 0).toString(36);
}

/**
 * Hash an array of product IDs
 * 
 * @param productIds - Array of product IDs
 * @returns Hash string representing the product combination
 * 
 * @example
 * hashProducts([1, 5, 10]) => "abc123"
 * hashProducts([10, 5, 1]) => "abc123" // Same hash (order independent)
 */
export function hashProducts(productIds: number[]): string {
  // Sort to ensure consistent hash regardless of order
  const sorted = [...productIds].sort((a, b) => a - b);
  const str = sorted.join(',');
  return simpleHash(str);
}

/**
 * Hash search preferences object
 * 
 * @param preferences - Search preferences object
 * @returns Hash string representing the preferences
 * 
 * @example
 * hashPreferences({ max_cooking_time: 30, difficulty: 'easy' }) => "def456"
 */
export function hashSearchPreferences(preferences?: SearchRecipePreferencesDTO): string {
  if (!preferences) {
    return 'none';
  }
  
  // Create a stable string representation
  const parts: string[] = [];
  
  if (preferences.max_cooking_time) {
    parts.push(`time:${preferences.max_cooking_time}`);
  }
  
  if (preferences.difficulty) {
    parts.push(`diff:${preferences.difficulty}`);
  }
  
  if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
    const sorted = [...preferences.dietary_restrictions].sort();
    parts.push(`diet:${sorted.join(',')}`);
  }
  
  if (parts.length === 0) {
    return 'none';
  }
  
  return simpleHash(parts.join('|'));
}

/**
 * Hash generation preferences object
 * 
 * @param preferences - Generation preferences object
 * @returns Hash string representing the preferences
 * 
 * @example
 * hashGeneratePreferences({ cuisine: 'Italian', difficulty: 'easy' }) => "ghi789"
 */
export function hashGeneratePreferences(preferences?: GenerateRecipePreferencesDTO): string {
  if (!preferences) {
    return 'none';
  }
  
  // Create a stable string representation
  const parts: string[] = [];
  
  if (preferences.cuisine) {
    parts.push(`cuisine:${preferences.cuisine.toLowerCase()}`);
  }
  
  if (preferences.max_cooking_time) {
    parts.push(`time:${preferences.max_cooking_time}`);
  }
  
  if (preferences.difficulty) {
    parts.push(`diff:${preferences.difficulty}`);
  }
  
  if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
    const sorted = [...preferences.dietary_restrictions].sort();
    parts.push(`diet:${sorted.join(',')}`);
  }
  
  if (parts.length === 0) {
    return 'none';
  }
  
  return simpleHash(parts.join('|'));
}

/**
 * Build a complete cache key for recipe search
 * 
 * @param userId - User ID
 * @param productIds - Array of product IDs
 * @param preferences - Search preferences
 * @returns Complete cache key
 * 
 * @example
 * buildSearchCacheKey('user-123', [1, 5, 10], { difficulty: 'easy' })
 * => "search:user-123:abc123:def456"
 */
export function buildSearchCacheKey(
  userId: string,
  productIds: number[],
  preferences?: SearchRecipePreferencesDTO
): string {
  const productsHash = hashProducts(productIds);
  const prefsHash = hashSearchPreferences(preferences);
  return `search:${userId}:${productsHash}:${prefsHash}`;
}

/**
 * Build a complete cache key for AI recipe generation
 * 
 * @param productIds - Array of product IDs
 * @param preferences - Generation preferences
 * @returns Complete cache key
 * 
 * @example
 * buildAICacheKey([1, 5, 10], { cuisine: 'Italian' })
 * => "ai:recipe:abc123:ghi789"
 */
export function buildAICacheKey(
  productIds: number[],
  preferences?: GenerateRecipePreferencesDTO
): string {
  const productsHash = hashProducts(productIds);
  const prefsHash = hashGeneratePreferences(preferences);
  return `ai:recipe:${productsHash}:${prefsHash}`;
}

/**
 * Hash a generic string (useful for prompt hashing)
 * 
 * @param str - String to hash
 * @returns Hash string
 */
export function hashString(str: string): string {
  return simpleHash(str);
}


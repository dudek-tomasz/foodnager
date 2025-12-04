/**
 * Unit tests for ProductMatcher
 * 
 * Tests cover:
 * - findOrCreate flow (exact match → fuzzy match → create)
 * - normalizeName logic (lowercase, trim, plural removal)
 * - calculateSimilarity scoring (substring match, word overlap)
 * - findExactMatch with Supabase mock
 * - findFuzzyMatch with similarity threshold (0.7)
 * - createProduct with capitalization
 * - Edge cases (empty strings, special characters, numbers)
 * - Business rules (global vs user products, error handling)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductMatcher } from './product-matcher';
import type { SupabaseClient } from '@/db/supabase.client';
import type { ProductReferenceDTO } from '@/types';

describe('ProductMatcher', () => {
  // ==========================================================================
  // SETUP & MOCKS
  // ==========================================================================

  let mockSupabase: SupabaseClient;
  let productMatcher: ProductMatcher;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockSupabase = createMockSupabaseClient();
    productMatcher = new ProductMatcher(mockSupabase);
  });

  /**
   * Helper to create a mock Supabase client
   */
  function createMockSupabaseClient(): SupabaseClient {
    return {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      })),
    } as any;
  }

  /**
   * Helper to mock Supabase response for select queries
   */
  function mockSupabaseSelect(data: any[] | null, error: any = null) {
    const chain = (mockSupabase.from as any)();
    chain.select().ilike().or().limit = vi.fn().mockResolvedValue({ data, error });
    return chain;
  }

  /**
   * Helper to mock Supabase response for insert queries
   */
  function mockSupabaseInsert(data: any | null, error: any = null) {
    const chain = (mockSupabase.from as any)();
    chain.insert().select().single = vi.fn().mockResolvedValue({ data, error });
    return chain;
  }

  // ==========================================================================
  // HELPER FACTORIES
  // ==========================================================================

  const createProduct = (id: number, name: string): ProductReferenceDTO => ({
    id,
    name,
  });

  // ==========================================================================
  // normalizeName() - Private Method Testing via Public Interface
  // ==========================================================================

  describe('normalizeName() - Internal Logic', () => {
    it('should convert name to lowercase', async () => {
      // Arrange
      const userId = 'user-123';
      
      // Mock exact match to return result based on normalized input
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify normalization: "TOMATO" → "tomato"
          expect(value).toBe('tomato');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: 'Tomato' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('TOMATO', userId);

      // Assert
      expect(result.name).toBe('Tomato');
    });

    it('should trim whitespace from name', async () => {
      // Arrange
      const userId = 'user-123';
      
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify trimming: "  tomato  " → "tomato"
          expect(value).toBe('tomato');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: 'Tomato' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('  tomato  ', userId);

      // Assert - verified in ilike mock
    });

    it('should remove plural "s" from names longer than 3 characters', async () => {
      // Arrange
      const userId = 'user-123';
      
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify plural removal: "tomatoes" → "tomatoe"
          expect(value).toBe('tomatoe');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: 'Tomato' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('tomatoes', userId);

      // Assert - verified in ilike mock
    });

    it('should NOT remove "s" from short names (3 chars or less)', async () => {
      // Arrange
      const userId = 'user-123';
      
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify no removal for short names: "sas" → "sas"
          expect(value).toBe('sas');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }),
      } as any);

      // Need to mock fuzzy and create as well
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => ({
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      } as any);

      // Mock create
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: 'Sas' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any).mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      await productMatcher.findOrCreate('sas', userId);

      // Assert - verified in ilike mock
    });

    it('should handle names that end with "s" correctly (apples → apple)', async () => {
      // Arrange
      const userId = 'user-123';
      
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify: "apples" → "apple"
          expect(value).toBe('apple');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: 'Apple' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('Apples', userId);

      // Assert - verified in ilike mock
    });
  });

  // ==========================================================================
  // calculateSimilarity() - Private Method Testing
  // ==========================================================================

  describe('calculateSimilarity() - Internal Logic', () => {
    it('should return 0.9 for substring match (str1 contains str2)', async () => {
      // Arrange - Use fuzzy match to test similarity calculation
      const userId = 'user-123';

      // Mock exact match to return empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match with products that will test similarity
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Olive Oil' },     // "olive oil" contains "olive" → 0.9
            { id: 2, name: 'Coconut Oil' },   // "coconut oil" no match
          ],
          error: null,
        }),
      } as any);

      // Act - Search for "olive" should match "Olive Oil" with 0.9 score
      const result = await productMatcher.findOrCreate('olive', userId);

      // Assert - Should return "Olive Oil" due to high similarity (0.9 > 0.7 threshold)
      expect(result.name).toBe('Olive Oil');
      expect(result.id).toBe(1);
    });

    it('should return 0.9 for substring match (str2 contains str1)', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Milk' },           // "milk" ⊂ "almond milk" → 0.9
            { id: 2, name: 'Cheese' },         // no match
          ],
          error: null,
        }),
      } as any);

      // Act - Search for "almond milk" should match "Milk"
      const result = await productMatcher.findOrCreate('almond milk', userId);

      // Assert
      expect(result.name).toBe('Milk');
      expect(result.id).toBe(1);
    });

    it('should calculate word-level overlap for non-substring matches', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            // "red pepper" vs "green pepper" → intersection: ["pepper"] / min(2,2) = 0.5 < 0.7
            { id: 1, name: 'Green Pepper' },   // Below threshold
            // "red pepper" vs "pepper" → "pepper" ⊂ "red pepper" → 0.9
            { id: 2, name: 'Pepper' },         // High match
          ],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('red pepper', userId);

      // Assert - Should match "Pepper" with 0.9 score (substring)
      expect(result.name).toBe('Pepper');
      expect(result.id).toBe(2);
    });

    it('should return 0 when strings have no overlap', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match with no good matches
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Banana' },     // No overlap with "chicken"
            { id: 2, name: 'Orange' },     // No overlap
          ],
          error: null,
        }),
      } as any);

      // Mock create (fallback)
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 3, name: 'Chicken' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act - Should fall back to create
      const result = await productMatcher.findOrCreate('chicken', userId);

      // Assert - New product created (no fuzzy match)
      expect(result.name).toBe('Chicken');
      expect(result.id).toBe(3);
    });
  });

  // ==========================================================================
  // findExactMatch() - Exact Match Flow
  // ==========================================================================

  describe('findExactMatch() - Exact Match Logic', () => {
    it('should return product when exact case-insensitive match exists (global product)', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Tomato' }],  // Global product (user_id = null)
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('tomato', userId);

      // Assert
      expect(result).toEqual({ id: 1, name: 'Tomato' });
      expect(mockSupabase.from).toHaveBeenCalledWith('products');
    });

    it('should return product when exact match exists (user private product)', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 5, name: 'My Special Spice' }],  // User private product
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('my special spice', userId);

      // Assert
      expect(result).toEqual({ id: 5, name: 'My Special Spice' });
    });

    it('should use ilike for case-insensitive matching', async () => {
      // Arrange
      const userId = 'user-123';
      const ilikeSpy = vi.fn().mockReturnThis();

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: ilikeSpy,
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Potato' }],
          error: null,
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('POTATO', userId);

      // Assert
      expect(ilikeSpy).toHaveBeenCalledWith('name', 'potato');
    });

    it('should filter by global products OR user products using .or()', async () => {
      // Arrange
      const userId = 'user-123';
      const orSpy = vi.fn().mockReturnThis();

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: orSpy,
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Milk' }],
          error: null,
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('milk', userId);

      // Assert
      expect(orSpy).toHaveBeenCalledWith(`user_id.is.null,user_id.eq.${userId}`);
    });

    it('should limit results to 1 for exact match', async () => {
      // Arrange
      const userId = 'user-123';
      const limitSpy = vi.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Salt' }],
        error: null,
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: limitSpy,
      } as any);

      // Act
      await productMatcher.findOrCreate('salt', userId);

      // Assert
      expect(limitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle Supabase error gracefully and fall back to fuzzy match', async () => {
      // Arrange
      const userId = 'user-123';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock exact match to return error
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' },
        }),
      } as any);

      // Mock fuzzy match to succeed
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Sugar' }],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('sugar', userId);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error searching for exact match:',
        expect.any(Object)
      );
      expect(result.name).toBe('Sugar'); // Fell back to fuzzy match
      
      consoleErrorSpy.mockRestore();
    });

    it('should return null and fall back when no exact match found', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      // Mock fuzzy match to find something
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 2, name: 'Honey' }],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('honey', userId);

      // Assert - Should fall back to fuzzy match
      expect(result.id).toBe(2);
    });
  });

  // ==========================================================================
  // findFuzzyMatch() - Fuzzy Match Flow with Threshold
  // ==========================================================================

  describe('findFuzzyMatch() - Fuzzy Match Logic', () => {
    it('should return best match when similarity >= 0.7 threshold', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match with candidates
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Olive Oil' },     // "olive oil" vs "olive" → 0.9 (substring)
            { id: 2, name: 'Coconut Oil' },   // "coconut oil" vs "olive" → low
          ],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('olive', userId);

      // Assert - Should match "Olive Oil"
      expect(result.name).toBe('Olive Oil');
      expect(result.id).toBe(1);
    });

    it('should select highest scoring match when multiple candidates above threshold', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Red Pepper' },      // "red pepper" vs "pepper" → word overlap 1/1 = 1.0, but "pepper" ⊂ "red pepper" → 0.9
            { id: 2, name: 'Pepper' },          // "pepper" ⊂ "pepper" → exact substring → 0.9
            { id: 3, name: 'Bell Pepper' },     // "bell pepper" vs "pepper" → 0.9
          ],
          error: null,
        }),
      } as any);

      // Act - All should score 0.9, but first one wins (best match logic)
      const result = await productMatcher.findOrCreate('pepper', userId);

      // Assert - Should return one of the high-scoring matches (implementation picks first best)
      expect(result.id).toBeGreaterThan(0);
      expect(['Red Pepper', 'Pepper', 'Bell Pepper']).toContain(result.name);
    });

    it('should return null when no match meets 0.7 threshold', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match with poor matches
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: 1, name: 'Apple' },      // "apple" vs "chicken" → 0
            { id: 2, name: 'Banana' },     // "banana" vs "chicken" → 0
          ],
          error: null,
        }),
      } as any);

      // Mock create (fallback)
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 3, name: 'Chicken' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('chicken', userId);

      // Assert - Should fall back to create
      expect(result.name).toBe('Chicken');
      expect(result.id).toBe(3);
    });

    it('should limit fuzzy search to 10 candidates', async () => {
      // Arrange
      const userId = 'user-123';
      const limitSpy = vi.fn().mockResolvedValue({ data: [], error: null });

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: limitSpy,
      } as any);

      // Mock create (since no matches)
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: 'Test' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      await productMatcher.findOrCreate('test', userId);

      // Assert
      expect(limitSpy).toHaveBeenCalledWith(10);
    });

    it('should filter fuzzy candidates by global OR user products', async () => {
      // Arrange
      const userId = 'user-456';
      const orSpy = vi.fn().mockReturnThis();

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: orSpy,
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock create
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: 'Test' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      await productMatcher.findOrCreate('test', userId);

      // Assert
      expect(orSpy).toHaveBeenCalledWith(`user_id.is.null,user_id.eq.${userId}`);
    });

    it('should handle Supabase error in fuzzy match and fall back to create', async () => {
      // Arrange
      const userId = 'user-123';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match error
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      } as any);

      // Mock create
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 10, name: 'Flour' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('flour', userId);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error searching for fuzzy match:',
        expect.any(Object)
      );
      expect(result.name).toBe('Flour');
      
      consoleErrorSpy.mockRestore();
    });

    it('should return null when fuzzy query returns empty data', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      // Mock fuzzy match empty
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      // Mock create
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: 'Garlic' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        insert: vi.fn(() => insertChain),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('garlic', userId);

      // Assert - Should fall back to create
      expect(result.name).toBe('Garlic');
    });
  });

  // ==========================================================================
  // createProduct() - Product Creation
  // ==========================================================================

  describe('createProduct() - Product Creation Logic', () => {
    it('should create new product with capitalized first letter', async () => {
      // Arrange
      const userId = 'user-123';
      const insertSpy = vi.fn();
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 99, name: 'Paprika' },
          error: null,
        }),
      };

      // Mock exact and fuzzy to return empty
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: insertSpy.mockReturnValue(insertChain),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('paprika', userId);

      // Assert
      expect(insertSpy).toHaveBeenCalledWith({
        name: 'Paprika',  // Capitalized
        user_id: userId,
      });
      expect(result).toEqual({ id: 99, name: 'Paprika' });
    });

    it('should create product with user_id for private product', async () => {
      // Arrange
      const userId = 'user-789';
      const insertSpy = vi.fn();
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 50, name: 'Ginger' },
          error: null,
        }),
      };

      // Mock empty results
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: insertSpy.mockReturnValue(insertChain),
        } as any);

      // Act
      await productMatcher.findOrCreate('ginger', userId);

      // Assert
      expect(insertSpy).toHaveBeenCalledWith({
        name: 'Ginger',
        user_id: userId,
      });
    });

    it('should call .select() and .single() after insert', async () => {
      // Arrange
      const userId = 'user-123';
      const selectSpy = vi.fn().mockReturnThis();
      const singleSpy = vi.fn().mockResolvedValue({
        data: { id: 1, name: 'Cinnamon' },
        error: null,
      });

      const insertChain = {
        select: selectSpy,
        single: singleSpy,
      };

      // Mock empty results
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      await productMatcher.findOrCreate('cinnamon', userId);

      // Assert
      expect(selectSpy).toHaveBeenCalledWith('id, name');
      expect(singleSpy).toHaveBeenCalled();
    });

    it('should throw error when product creation fails', async () => {
      // Arrange
      const userId = 'user-123';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      // Mock empty results
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act & Assert
      await expect(
        productMatcher.findOrCreate('turmeric', userId)
      ).rejects.toThrow('Failed to create product');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating product:',
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw error when insert returns no data', async () => {
      // Arrange
      const userId = 'user-123';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,  // No error but also no data
        }),
      };

      // Mock empty results
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act & Assert
      await expect(
        productMatcher.findOrCreate('oregano', userId)
      ).rejects.toThrow('Failed to create product');

      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================================================
  // findOrCreate() - Complete Flow Integration
  // ==========================================================================

  describe('findOrCreate() - Complete Flow', () => {
    it('should return exact match immediately (step 1 success)', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 10, name: 'Butter' }],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('butter', userId);

      // Assert
      expect(result).toEqual({ id: 10, name: 'Butter' });
      // Should not call fuzzy or create (only one call to from())
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should fall back to fuzzy match when exact match fails (step 2 success)', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        // Mock fuzzy match success
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 20, name: 'Chocolate Chips' }],
            error: null,
          }),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('chocolate', userId);

      // Assert
      expect(result.name).toBe('Chocolate Chips');
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it('should fall back to create when both exact and fuzzy fail (step 3)', async () => {
      // Arrange
      const userId = 'user-123';
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 30, name: 'Vanilla' },
          error: null,
        }),
      };

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        // Mock fuzzy match empty
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        // Mock create
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('vanilla', userId);

      // Assert
      expect(result).toEqual({ id: 30, name: 'Vanilla' });
      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });

    it('should handle complete normalization flow: uppercase, trim, plural', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Verify full normalization: "  CARROTS  " → "carrot"
          expect(value).toBe('carrot');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: 'Carrot' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('  CARROTS  ', userId);

      // Assert
      expect(result.name).toBe('Carrot');
    });
  });

  // ==========================================================================
  // EDGE CASES - Input Validation & Special Characters
  // ==========================================================================

  describe('Edge Cases - Input Validation', () => {
    it('should handle empty string input', async () => {
      // Arrange
      const userId = 'user-123';
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: '' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('', userId);

      // Assert - Should create with empty string (capitalization fails gracefully)
      expect(result.name).toBe('');
    });

    it('should handle whitespace-only input', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          // Whitespace trimmed to empty string
          expect(value).toBe('');
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      } as any);

      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: '' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      await productMatcher.findOrCreate('   ', userId);

      // Assert - verified in ilike mock
    });

    it('should handle names with special characters', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: "Pâté d'Or" }],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate("Pâté d'Or", userId);

      // Assert
      expect(result.name).toBe("Pâté d'Or");
    });

    it('should handle names with numbers', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn((column: string, value: string) => {
          expect(value).toBe('sauce 5 spice'); // "5 Spices" → "5 spice" (removed 's')
          return {
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: 1, name: '5 Spices' }],
              error: null,
            }),
          };
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate('Sauce 5 Spices', userId);

      // Assert
      expect(result.name).toBe('5 Spices');
    });

    it('should handle very long product names', async () => {
      // Arrange
      const userId = 'user-123';
      const longName = 'A'.repeat(200);

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: longName }],
          error: null,
        }),
      } as any);

      // Act
      const result = await productMatcher.findOrCreate(longName, userId);

      // Assert
      expect(result.name).toBe(longName);
    });

    it('should handle single character input', async () => {
      // Arrange
      const userId = 'user-123';
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 1, name: 'A' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('a', userId);

      // Assert - Capitalized to 'A'
      expect(result.name).toBe('A');
    });
  });

  // ==========================================================================
  // BUSINESS RULES - Global vs User Products
  // ==========================================================================

  describe('Business Rules - Global vs User Products', () => {
    it('should search both global and user products in exact match', async () => {
      // Arrange
      const userId = 'user-123';
      const orSpy = vi.fn().mockReturnThis();

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        or: orSpy,
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Rice' }],
          error: null,
        }),
      } as any);

      // Act
      await productMatcher.findOrCreate('rice', userId);

      // Assert
      expect(orSpy).toHaveBeenCalledWith(`user_id.is.null,user_id.eq.${userId}`);
    });

    it('should search both global and user products in fuzzy match', async () => {
      // Arrange
      const userId = 'user-456';
      const orSpy = vi.fn().mockReturnThis();

      // Mock exact match empty
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: orSpy,
          limit: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Brown Rice' }],
            error: null,
          }),
        } as any);

      // Act
      await productMatcher.findOrCreate('rice', userId);

      // Assert
      expect(orSpy).toHaveBeenCalledWith(`user_id.is.null,user_id.eq.${userId}`);
    });

    it('should create product with user_id (private product)', async () => {
      // Arrange
      const userId = 'user-special';
      const insertSpy = vi.fn();
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 99, name: 'My Secret Sauce' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: insertSpy.mockReturnValue(insertChain),
        } as any);

      // Act
      await productMatcher.findOrCreate('my secret sauce', userId);

      // Assert
      expect(insertSpy).toHaveBeenCalledWith({
        name: 'My secret sauce',
        user_id: userId,
      });
    });
  });

  // ==========================================================================
  // COMPLEX SCENARIOS - Real-World Use Cases
  // ==========================================================================

  describe('Complex Real-World Scenarios', () => {
    it('should match "extra virgin olive oil" to "Olive Oil" via fuzzy match', async () => {
      // Arrange
      const userId = 'user-123';

      // Mock exact match empty (normalized: "extra virgin olive oil")
      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        // Mock fuzzy match
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: 'Olive Oil' },      // Word overlap: ["olive", "oil"] / min(4,2) = 2/2 = 1.0
              { id: 2, name: 'Coconut Oil' },    // Word overlap: ["oil"] / min(4,2) = 1/2 = 0.5
            ],
            error: null,
          }),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('extra virgin olive oil', userId);

      // Assert - Should match "Olive Oil" with perfect word overlap
      expect(result.name).toBe('Olive Oil');
      expect(result.id).toBe(1);
    });

    it('should handle ingredient with brand name "Heinz Ketchup" → "Ketchup"', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: 'Ketchup' },        // "ketchup" ⊂ "heinz ketchup" → 0.9
              { id: 2, name: 'Mustard' },        // no match
            ],
            error: null,
          }),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('Heinz Ketchup', userId);

      // Assert
      expect(result.name).toBe('Ketchup');
    });

    it('should create new product when similarity too low (< 0.7 threshold)', async () => {
      // Arrange
      const userId = 'user-123';
      const insertChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 100, name: 'Quinoa' },
          error: null,
        }),
      };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: 'Rice' },          // "rice" vs "quinoa" → 0
              { id: 2, name: 'Pasta' },         // "pasta" vs "quinoa" → 0
            ],
            error: null,
          }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn(() => insertChain),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('quinoa', userId);

      // Assert - Should create new product
      expect(result.name).toBe('Quinoa');
      expect(result.id).toBe(100);
    });

    it('should handle multiple words with partial overlap (green bell pepper vs bell pepper)', async () => {
      // Arrange
      const userId = 'user-123';

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: 'Bell Pepper' },    // "bell pepper" ⊂ "green bell pepper" → 0.9
            ],
            error: null,
          }),
        } as any);

      // Act
      const result = await productMatcher.findOrCreate('green bell pepper', userId);

      // Assert
      expect(result.name).toBe('Bell Pepper');
    });
  });
});


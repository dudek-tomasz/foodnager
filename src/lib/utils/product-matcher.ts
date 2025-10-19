/**
 * ProductMatcher
 * 
 * Fuzzy matching utility for finding or creating products
 * Used when mapping external ingredients to internal products
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { ProductReferenceDTO } from '../../types';

/**
 * ProductMatcher class
 * 
 * Implements fuzzy matching logic to find existing products by name
 * If no match found, creates new product for the user
 */
export class ProductMatcher {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Find existing product by fuzzy name match, or create new one
   * 
   * Matching strategy:
   * 1. Exact match (case-insensitive)
   * 2. Partial match (contains)
   * 3. Create new product if no match
   * 
   * @param productName - Product name to search for
   * @param userId - User ID for product ownership
   * @returns Product reference
   */
  async findOrCreate(productName: string, userId: string): Promise<ProductReferenceDTO> {
    const normalizedName = this.normalizeName(productName);

    // Step 1: Try exact match (case-insensitive)
    const exactMatch = await this.findExactMatch(normalizedName, userId);
    if (exactMatch) {
      return exactMatch;
    }

    // Step 2: Try partial match (fuzzy)
    const fuzzyMatch = await this.findFuzzyMatch(normalizedName, userId);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Step 3: Create new product
    return await this.createProduct(normalizedName, userId);
  }

  /**
   * Normalize product name for matching
   * - Lowercase
   * - Trim whitespace
   * - Remove plural 's' (simple heuristic)
   */
  private normalizeName(name: string): string {
    let normalized = name.toLowerCase().trim();
    
    // Remove plural 's' (simple heuristic)
    if (normalized.endsWith('s') && normalized.length > 3) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Find product by exact name match (case-insensitive)
   * Searches both global products and user's private products
   * 
   * @param normalizedName - Normalized product name
   * @param userId - User ID
   * @returns Product reference or null
   */
  private async findExactMatch(
    normalizedName: string,
    userId: string
  ): Promise<ProductReferenceDTO | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, name')
      .ilike('name', normalizedName)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .limit(1);

    if (error) {
      console.error('Error searching for exact match:', error);
      return null;
    }

    if (data && data.length > 0) {
      return {
        id: data[0].id,
        name: data[0].name,
      };
    }

    return null;
  }

  /**
   * Find product by fuzzy match (partial name match)
   * 
   * @param normalizedName - Normalized product name
   * @param userId - User ID
   * @returns Product reference or null
   */
  private async findFuzzyMatch(
    normalizedName: string,
    userId: string
  ): Promise<ProductReferenceDTO | null> {
    // Search for products where normalized name contains search term or vice versa
    const { data, error } = await this.supabase
      .from('products')
      .select('id, name')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .limit(10); // Get multiple candidates for fuzzy matching

    if (error) {
      console.error('Error searching for fuzzy match:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find best match using similarity score
    let bestMatch: ProductReferenceDTO | null = null;
    let bestScore = 0;

    for (const product of data) {
      const productNormalized = this.normalizeName(product.name);
      const score = this.calculateSimilarity(normalizedName, productNormalized);

      if (score > bestScore && score >= 0.7) {
        // Threshold: 70% similarity
        bestScore = score;
        bestMatch = {
          id: product.id,
          name: product.name,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity score between two strings
   * Uses simple overlap coefficient: |A ∩ B| / min(|A|, |B|)
   * 
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score (0.0 - 1.0)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Check if one string contains the other
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9; // High score for substring match
    }

    // Simple word-level overlap
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const minSize = Math.min(set1.size, set2.size);

    if (minSize === 0) return 0;

    return intersection.size / minSize;
  }

  /**
   * Create new product for user
   * 
   * @param normalizedName - Normalized product name
   * @param userId - User ID
   * @returns Created product reference
   */
  private async createProduct(
    normalizedName: string,
    userId: string
  ): Promise<ProductReferenceDTO> {
    // Capitalize first letter for display
    const displayName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);

    const { data, error } = await this.supabase
      .from('products')
      .insert({
        name: displayName,
        user_id: userId,
      })
      .select('id, name')
      .single();

    if (error || !data) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }

    return {
      id: data.id,
      name: data.name,
    };
  }
}


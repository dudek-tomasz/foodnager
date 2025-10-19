/**
 * ProductService - Business logic for Products API
 * 
 * Handles all product-related operations including:
 * - Listing products (global + user-specific) with search and pagination
 * - Creating new user-specific products
 * - Updating products (with fork logic for global products)
 * - Deleting user-specific products (protection for global products)
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type {
  ProductDTO,
  ListProductsQueryDTO,
  CreateProductDTO,
  UpdateProductDTO,
  ProductsListResponseDTO,
  ProductEntity,
} from '../../types';
import { NotFoundError, ConflictError, ForbiddenError } from '../errors';
import { calculatePaginationMeta, calculateOffset } from '../utils/pagination';

/**
 * ProductService class
 * All methods require SupabaseClient instance with authenticated user context
 */
export class ProductService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists products available to the user (global + user's private products)
   * Supports full-text search and pagination
   * 
   * @param userId - Current authenticated user ID
   * @param query - Query parameters (search, scope, page, limit)
   * @returns Paginated list of products with metadata
   */
  async listProducts(
    userId: string,
    query: ListProductsQueryDTO
  ): Promise<ProductsListResponseDTO> {
    const { search, scope = 'all', page = 1, limit = 20 } = query;
    const offset = calculateOffset(page, limit);

    // Build base query
    let queryBuilder = this.supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply scope filter
    if (scope === 'global') {
      queryBuilder = queryBuilder.is('user_id', null);
    } else if (scope === 'private') {
      queryBuilder = queryBuilder.eq('user_id', userId);
    } else {
      // scope === 'all': return global + user's private products
      queryBuilder = queryBuilder.or(`user_id.is.null,user_id.eq.${userId}`);
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      // Use full-text search for better performance
      queryBuilder = queryBuilder.textSearch('name', search.trim(), {
        type: 'websearch',
        config: 'english',
      });
    }

    // Apply pagination and ordering
    queryBuilder = queryBuilder
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    // Transform to ProductDTO (add is_global field)
    const products: ProductDTO[] = (data || []).map((product: ProductEntity) => ({
      ...product,
      is_global: product.user_id === null,
    }));

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(page, limit, count || 0);

    return {
      data: products,
      pagination,
    };
  }

  /**
   * Gets a single product by ID
   * User can access global products or their own private products
   * 
   * @param userId - Current authenticated user ID
   * @param productId - Product ID to fetch
   * @returns Product DTO
   * @throws NotFoundError if product doesn't exist or user doesn't have access
   */
  async getProductById(userId: string, productId: number): Promise<ProductDTO> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }

    if (!data) {
      throw new NotFoundError('Product not found');
    }

    return {
      ...data,
      is_global: data.user_id === null,
    };
  }

  /**
   * Creates a new user-specific product
   * Validates uniqueness of name (case-insensitive) within user's products
   * 
   * @param userId - Current authenticated user ID
   * @param createDto - Product data (name)
   * @returns Created product DTO
   * @throws ConflictError if product with this name already exists for user
   */
  async createProduct(
    userId: string,
    createDto: CreateProductDTO
  ): Promise<ProductDTO> {
    const { name } = createDto;

    // Check for duplicate name (case-insensitive) in user's products
    await this.checkProductNameUniqueness(userId, name);

    // Insert new product
    const { data, error } = await this.supabase
      .from('products')
      .insert({
        user_id: userId,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new ConflictError('Product with this name already exists');
      }
      
      throw new Error('Failed to create product');
    }

    return {
      ...data,
      is_global: false, // Always false for newly created products
    };
  }

  /**
   * Updates a product or creates a fork if it's a global product
   * 
   * Behavior:
   * - Own private product: updates in place
   * - Global product: creates new private product (fork)
   * - Other user's product: throws NotFoundError
   * 
   * @param userId - Current authenticated user ID
   * @param productId - Product ID to update
   * @param updateDto - Updated product data
   * @returns Updated/created product and flag indicating if it's a new product
   * @throws NotFoundError if product doesn't exist or user doesn't have access
   * @throws ConflictError if new name conflicts with existing product
   */
  async updateProduct(
    userId: string,
    productId: number,
    updateDto: UpdateProductDTO
  ): Promise<{ product: ProductDTO; isNewProduct: boolean }> {
    // First, fetch the existing product
    const existingProduct = await this.getProductById(userId, productId);

    // Case A: User's own private product - update in place
    if (existingProduct.user_id === userId) {
      // If name is being changed, check for uniqueness
      if (updateDto.name && updateDto.name !== existingProduct.name) {
        await this.checkProductNameUniqueness(userId, updateDto.name, productId);
      }

      const { data, error } = await this.supabase
        .from('products')
        .update({
          name: updateDto.name?.trim(),
        })
        .eq('id', productId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw new Error('Failed to update product');
      }

      return {
        product: {
          ...data,
          is_global: false,
        },
        isNewProduct: false,
      };
    }

    // Case B: Global product - create fork (new private product)
    if (existingProduct.user_id === null) {
      const newName = updateDto.name || existingProduct.name;
      
      // Check if user already has a product with this name
      await this.checkProductNameUniqueness(userId, newName);

      const { data, error } = await this.supabase
        .from('products')
        .insert({
          user_id: userId,
          name: newName.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error forking product:', error);
        
        if (error.code === '23505') {
          throw new ConflictError('You already have a product with this name');
        }
        
        throw new Error('Failed to fork product');
      }

      return {
        product: {
          ...data,
          is_global: false,
        },
        isNewProduct: true,
      };
    }

    // Case C: Another user's product - should never reach here due to RLS
    // but handle it explicitly for safety
    throw new NotFoundError('Product not found');
  }

  /**
   * Deletes a user's private product
   * Global products cannot be deleted
   * 
   * @param userId - Current authenticated user ID
   * @param productId - Product ID to delete
   * @throws NotFoundError if product doesn't exist
   * @throws ForbiddenError if trying to delete a global product
   */
  async deleteProduct(userId: string, productId: number): Promise<void> {
    // First, fetch the product to check if it's global
    const product = await this.getProductById(userId, productId);

    // Prevent deletion of global products
    if (product.user_id === null) {
      throw new ForbiddenError('Cannot delete global products', {
        product_id: productId,
        is_global: true,
      });
    }

    // Ensure it's user's own product
    if (product.user_id !== userId) {
      throw new NotFoundError('Product not found');
    }

    // Delete the product (CASCADE will handle related records)
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Checks if a product name already exists for the user (case-insensitive)
   * 
   * @param userId - User ID to check against
   * @param name - Product name to check
   * @param excludeId - Optional product ID to exclude from check (for updates)
   * @throws ConflictError if name already exists
   */
  private async checkProductNameUniqueness(
    userId: string,
    name: string,
    excludeId?: number
  ): Promise<void> {
    let query = this.supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', name.trim());

    // Exclude current product ID when updating
    if (excludeId !== undefined) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error checking product uniqueness:', error);
      throw new Error('Failed to check product uniqueness');
    }

    if (data) {
      throw new ConflictError('Product with this name already exists', {
        field: 'name',
        value: name.trim(),
      });
    }
  }
}


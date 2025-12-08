/**
 * FridgeService - Business logic for Virtual Fridge API
 *
 * Handles all fridge-related operations including:
 * - Listing fridge items with advanced filtering (expired, expiring soon, search)
 * - Getting individual fridge items
 * - Adding products to fridge
 * - Updating fridge items (quantity, unit, expiry_date)
 * - Removing products from fridge
 */

/* eslint-disable no-console */
// Console logs are intentional for debugging fridge operations

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FridgeItemDTO,
  ListFridgeQueryDTO,
  CreateFridgeItemDTO,
  UpdateFridgeItemDTO,
  FridgeListResponseDTO,
} from "../../types";
import { NotFoundError } from "../errors";
import { calculatePaginationMeta, calculateOffset } from "../utils/pagination";

/**
 * Interface for raw database row with JOINed data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FridgeItemRow {
  id: number;
  product_id: number;
  quantity: number;
  unit_id: number;
  expiry_date: string | null;
  created_at: string;
  product_name: string;
  unit_name: string;
  unit_abbreviation: string;
}

/**
 * FridgeService class
 * All methods require SupabaseClient instance with authenticated user context
 */
export class FridgeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists fridge items with advanced filtering and pagination
   *
   * Supports:
   * - Filtering by expiry status (expired, not expired, all)
   * - Filtering by expiring soon threshold
   * - Full-text search in product names
   * - Sorting by multiple fields
   * - Pagination
   *
   * @param userId - Current authenticated user ID
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of fridge items
   */
  async listFridgeItems(userId: string, query: ListFridgeQueryDTO): Promise<FridgeListResponseDTO> {
    const { expired = "all", expiring_soon, search, sort = "created_at", order = "desc", page = 1, limit = 20 } = query;

    const offset = calculateOffset(page, limit);

    // Build complex query with JOINs
    let queryBuilder = this.supabase
      .from("user_products")
      .select(
        `
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(name),
        units!inner(name, abbreviation)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    // Apply expired filter
    const today = new Date().toISOString().split("T")[0];

    if (expired === "yes") {
      // Show only expired products (expiry_date < today)
      queryBuilder = queryBuilder.lt("expiry_date", today);
    } else if (expired === "no") {
      // Show only non-expired products (null OR >= today)
      queryBuilder = queryBuilder.or(`expiry_date.is.null,expiry_date.gte.${today}`);
    }
    // expired === 'all' - no filter

    // Apply expiring_soon filter
    if (expiring_soon !== undefined && expiring_soon > 0) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + expiring_soon);
      const thresholdStr = threshold.toISOString().split("T")[0];

      queryBuilder = queryBuilder.gte("expiry_date", today).lte("expiry_date", thresholdStr);
    }

    // Apply search filter on product name
    if (search && search.trim()) {
      // Use ilike for case-insensitive search on joined table
      queryBuilder = queryBuilder.ilike("products.name", `%${search.trim()}%`);
    }

    // Apply sorting
    // Note: For sorting by joined table columns (like product name),
    // we need to use the foreignTable option
    if (sort === "name") {
      queryBuilder = queryBuilder.order("name", {
        ascending: order === "asc",
        foreignTable: "products",
      });
    } else {
      // For local columns (quantity, expiry_date, created_at)
      queryBuilder = queryBuilder.order(sort, { ascending: order === "asc" });
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching fridge items:", error);
      throw new Error("Failed to fetch fridge items");
    }

    // Transform to FridgeItemDTO
    const items: FridgeItemDTO[] = (data || []).map((item) => this.transformToFridgeItemDTO(item));

    // Calculate pagination metadata
    const pagination = calculatePaginationMeta(page, limit, count || 0);

    return {
      data: items,
      pagination,
    };
  }

  /**
   * Gets a single fridge item by ID
   *
   * @param userId - Current authenticated user ID
   * @param itemId - Fridge item ID
   * @returns Fridge item DTO
   * @throws NotFoundError if item doesn't exist or doesn't belong to user
   */
  async getFridgeItemById(userId: string, itemId: number): Promise<FridgeItemDTO> {
    const { data, error } = await this.supabase
      .from("user_products")
      .select(
        `
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(name),
        units!inner(name, abbreviation)
      `
      )
      .eq("id", itemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching fridge item:", error);
      throw new Error("Failed to fetch fridge item");
    }

    if (!data) {
      throw new NotFoundError("Fridge item not found");
    }

    return this.transformToFridgeItemDTO(data);
  }

  /**
   * Adds a new item to the fridge
   * Validates that product and unit exist before inserting
   *
   * @param userId - Current authenticated user ID
   * @param createDto - Item data to create
   * @returns Created fridge item
   * @throws NotFoundError if product or unit doesn't exist
   */
  async addItemToFridge(userId: string, createDto: CreateFridgeItemDTO): Promise<FridgeItemDTO> {
    const { product_id, quantity, unit_id, expiry_date } = createDto;

    // Verify product exists and is accessible to user (global or own)
    await this.verifyProductAccess(userId, product_id);

    // Verify unit exists
    await this.verifyUnitExists(unit_id);

    // Insert new fridge item
    const { data, error } = await this.supabase
      .from("user_products")
      .insert({
        user_id: userId,
        product_id,
        quantity,
        unit_id,
        expiry_date: expiry_date ?? null,
      })
      .select(
        `
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(name),
        units!inner(name, abbreviation)
      `
      )
      .single();

    if (error) {
      console.error("Error adding item to fridge:", error);
      throw new Error("Failed to add item to fridge");
    }

    return this.transformToFridgeItemDTO(data);
  }

  /**
   * Updates an existing fridge item
   * Can update quantity, unit, and expiry_date (not product_id)
   *
   * @param userId - Current authenticated user ID
   * @param itemId - Fridge item ID to update
   * @param updateDto - Updated item data
   * @returns Updated fridge item
   * @throws NotFoundError if item doesn't exist or unit doesn't exist
   */
  async updateFridgeItem(userId: string, itemId: number, updateDto: UpdateFridgeItemDTO): Promise<FridgeItemDTO> {
    // First, verify the item exists and belongs to user
    await this.getFridgeItemById(userId, itemId);

    // If unit_id is being changed, verify new unit exists
    if (updateDto.unit_id !== undefined) {
      await this.verifyUnitExists(updateDto.unit_id);
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (updateDto.quantity !== undefined) updateData.quantity = updateDto.quantity;
    if (updateDto.unit_id !== undefined) updateData.unit_id = updateDto.unit_id;
    if (updateDto.expiry_date !== undefined) updateData.expiry_date = updateDto.expiry_date;

    // Update the item
    const { data, error } = await this.supabase
      .from("user_products")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", userId)
      .select(
        `
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(name),
        units!inner(name, abbreviation)
      `
      )
      .single();

    if (error) {
      console.error("Error updating fridge item:", error);
      throw new Error("Failed to update fridge item");
    }

    return this.transformToFridgeItemDTO(data);
  }

  /**
   * Deletes a fridge item
   *
   * @param userId - Current authenticated user ID
   * @param itemId - Fridge item ID to delete
   * @throws NotFoundError if item doesn't exist or doesn't belong to user
   */
  async deleteFridgeItem(userId: string, itemId: number): Promise<void> {
    const { error, count } = await this.supabase
      .from("user_products")
      .delete({ count: "exact" })
      .eq("id", itemId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting fridge item:", error);
      throw new Error("Failed to delete fridge item");
    }

    // Check if any rows were deleted
    if (count === 0) {
      throw new NotFoundError("Fridge item not found");
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Transforms raw database row with JOINed data to FridgeItemDTO
   *
   * @param row - Raw database row
   * @returns Transformed FridgeItemDTO
   */
  private transformToFridgeItemDTO(row: {
    id: number;
    product_id: number;
    products: { name: string };
    quantity: number;
    unit_id: number;
    units: { name: string; abbreviation: string };
    expiry_date: string | null;
    created_at: string;
    updated_at: string;
  }): FridgeItemDTO {
    return {
      id: row.id,
      product: {
        id: row.product_id,
        name: row.products.name,
      },
      quantity: row.quantity,
      unit: {
        id: row.unit_id,
        name: row.units.name,
        abbreviation: row.units.abbreviation,
      },
      expiry_date: row.expiry_date,
      created_at: row.created_at,
    };
  }

  /**
   * Verifies that a product exists and is accessible to the user
   * User can access global products (user_id = NULL) or their own products
   *
   * @param userId - Current authenticated user ID
   * @param productId - Product ID to verify
   * @throws NotFoundError if product doesn't exist or isn't accessible
   */
  private async verifyProductAccess(userId: string, productId: number): Promise<void> {
    const { data, error } = await this.supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .maybeSingle();

    if (error) {
      console.error("Error verifying product access:", error);
      throw new Error("Failed to verify product");
    }

    if (!data) {
      throw new NotFoundError("Product not found");
    }
  }

  /**
   * Verifies that a unit exists
   *
   * @param unitId - Unit ID to verify
   * @throws NotFoundError if unit doesn't exist
   */
  private async verifyUnitExists(unitId: number): Promise<void> {
    const { data, error } = await this.supabase.from("units").select("id").eq("id", unitId).maybeSingle();

    if (error) {
      console.error("Error verifying unit:", error);
      throw new Error("Failed to verify unit");
    }

    if (!data) {
      throw new NotFoundError("Unit not found");
    }
  }
}

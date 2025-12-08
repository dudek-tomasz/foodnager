/**
 * Service for Cooking History Management
 *
 * Handles:
 * - Listing cooking history with filtering and pagination
 * - Creating cooking history entries with automatic fridge updates
 * - Transforming database results to DTOs
 * - Parsing PostgreSQL function errors
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  ListCookingHistoryQueryDTO,
  CookingHistoryListResponseDTO,
  CookingHistoryDTO,
  CreateCookingHistoryResponseDTO,
  FridgeStateDTO,
  UpdatedFridgeItemDTO,
} from "../../types";
import { NotFoundError, InsufficientIngredientsError } from "../errors";
import { calculatePaginationMeta } from "../utils/pagination";

/**
 * Interface for the result from record_cooking_event PostgreSQL function
 */
interface RecordCookingEventResult {
  history_id: number;
  recipe_id: number;
  recipe_title: string;
  cooked_at: string;
  fridge_before: FridgeStateDTO;
  fridge_after: FridgeStateDTO;
  updated_items: UpdatedFridgeItemDTO[];
}

/**
 * Service class for Cooking History operations
 */
export class CookingHistoryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Lists cooking history with optional filters and pagination
   *
   * @param userId - The authenticated user's ID
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of cooking history entries
   */
  async listCookingHistory(userId: string, query: ListCookingHistoryQueryDTO): Promise<CookingHistoryListResponseDTO> {
    const { recipe_id, from_date, to_date, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Build query with filters
    let queryBuilder = this.supabase
      .from("cooking_history")
      .select(
        `
        id,
        recipe_id,
        cooked_at,
        fridge_state_before,
        fridge_state_after,
        recipes!inner(id, title)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("cooked_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional filters
    if (recipe_id) {
      queryBuilder = queryBuilder.eq("recipe_id", recipe_id);
    }

    if (from_date) {
      queryBuilder = queryBuilder.gte("cooked_at", `${from_date}T00:00:00Z`);
    }

    if (to_date) {
      queryBuilder = queryBuilder.lte("cooked_at", `${to_date}T23:59:59Z`);
    }

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    // Transform to DTOs
    const historyDTOs: CookingHistoryDTO[] = (data || []).map((row) => ({
      id: row.id,
      recipe: {
        id: row.recipe_id,
        title: Array.isArray(row.recipes) ? row.recipes[0].title : row.recipes.title,
      },
      cooked_at: row.cooked_at,
      fridge_state_before: row.fridge_state_before as unknown as FridgeStateDTO,
      fridge_state_after: row.fridge_state_after as unknown as FridgeStateDTO,
    }));

    return {
      data: historyDTOs,
      pagination: calculatePaginationMeta(page, limit, count || 0),
    };
  }

  /**
   * Creates a cooking history entry and automatically updates fridge
   *
   * This method:
   * 1. Validates recipe exists and belongs to user
   * 2. Calls PostgreSQL function to handle atomic transaction
   * 3. Transforms result to DTO
   * 4. Parses and throws appropriate errors
   *
   * @param userId - The authenticated user's ID
   * @param recipeId - The recipe that was cooked
   * @param manualConversions - Optional manual conversions for ingredients with incompatible units
   * @returns Created cooking history entry with update details
   * @throws NotFoundError if recipe doesn't exist or doesn't belong to user
   * @throws InsufficientIngredientsError if not enough ingredients in fridge
   */
  async createCookingHistoryEntry(
    userId: string,
    recipeId: number,
    manualConversions?: Record<number, number>
  ): Promise<CreateCookingHistoryResponseDTO> {
    try {
      // Call PostgreSQL function to handle the complex transaction
      // Note: Type assertion needed because function not yet in database.types.ts
      const { data, error } = await (
        this.supabase.rpc as (
          name: string,
          params: Record<string, unknown>
        ) => Promise<{ data: unknown; error: unknown }>
      )("record_cooking_event", {
        p_user_id: userId,
        p_recipe_id: recipeId,
        p_manual_conversions: manualConversions || {},
      });

      if (error) {
        throw error;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("Failed to record cooking event - no data returned");
      }

      // Handle both array and single object responses
      const result: RecordCookingEventResult = Array.isArray(data) ? data[0] : data;

      // Transform to response DTO
      return {
        id: result.history_id,
        recipe: {
          id: result.recipe_id,
          title: result.recipe_title,
        },
        cooked_at: result.cooked_at,
        fridge_state_before: result.fridge_before,
        fridge_state_after: result.fridge_after,
        updated_fridge_items: Array.isArray(result.updated_items) ? result.updated_items : [],
      };
    } catch (error: unknown) {
      // Parse PostgreSQL exceptions and throw appropriate API errors
      const errorMessage = (error as Error)?.message || String(error);

      // Recipe not found or doesn't belong to user
      if (errorMessage.includes("Recipe not found")) {
        throw new NotFoundError("Recipe not found or does not belong to you");
      }

      // Insufficient ingredients
      if (errorMessage.includes("Insufficient ingredient")) {
        const details = this.parseInsufficientIngredientsError(errorMessage);
        throw new InsufficientIngredientsError("Not enough ingredients in fridge to cook this recipe", {
          missing: [details],
        });
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Parses PostgreSQL error message for insufficient ingredients
   *
   * Expected format: "Insufficient ingredient: product_id=10, product_name=Tomato, required=5, available=3"
   *
   * @param errorMessage - The PostgreSQL error message
   * @returns Parsed ingredient details
   */
  private parseInsufficientIngredientsError(errorMessage: string): {
    product_id: number;
    product_name: string;
    required: number;
    available: number;
  } {
    const match = errorMessage.match(/product_id=(\d+), product_name=([^,]+), required=([\d.]+), available=([\d.]+)/);

    if (match) {
      return {
        product_id: parseInt(match[1]),
        product_name: match[2],
        required: parseFloat(match[3]),
        available: parseFloat(match[4]),
      };
    }

    // Fallback if parsing fails
    return {
      product_id: 0,
      product_name: "Unknown",
      required: 0,
      available: 0,
    };
  }
}

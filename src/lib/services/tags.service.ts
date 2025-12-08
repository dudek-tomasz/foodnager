/**
 * TagsService - Business logic for Tags Dictionary API
 *
 * Handles retrieval and creation of recipe tags from the database.
 * Tags are global (not user-specific) and used for categorizing recipes.
 * They change occasionally, making them good candidates for caching.
 */

/* eslint-disable no-console */
// Console logs are intentional for debugging tag operations

import type { SupabaseClient } from "../../db/supabase.client";
import type { TagDTO } from "../../types";
import { ConflictError } from "../errors";

/**
 * TagsService class
 * Provides methods for fetching and creating recipe tags
 */
export class TagsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists all available tags, optionally filtered by search term
   * Returns tags sorted alphabetically by name
   *
   * @param search - Optional search term for filtering tags (case-insensitive)
   * @returns Array of tags matching the search criteria
   * @throws Error if database query fails
   */
  async listTags(search?: string): Promise<TagDTO[]> {
    let query = this.supabase.from("tags").select("id, name, created_at").order("name", { ascending: true });

    // Apply search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tags:", error);
      throw new Error("Failed to fetch tags");
    }

    // Transform to TagDTO (though structure is already correct)
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
    }));
  }

  /**
   * Creates a new tag with the given name
   * Checks for uniqueness (case-insensitive) before creating
   *
   * @param name - Tag name (should be already normalized to lowercase)
   * @returns Newly created tag
   * @throws ConflictError if tag with this name already exists
   * @throws Error if database operation fails
   */
  async createTag(name: string): Promise<TagDTO> {
    // Check uniqueness (case-insensitive)
    const { data: existing, error: checkError } = await this.supabase
      .from("tags")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking tag uniqueness:", checkError);
      throw new Error("Failed to check tag uniqueness");
    }

    if (existing) {
      throw new ConflictError("Tag with this name already exists", {
        field: "name",
        value: name,
      });
    }

    // Insert new tag
    const { data, error } = await this.supabase.from("tags").insert({ name }).select("id, name, created_at").single();

    if (error) {
      console.error("Error creating tag:", error);
      throw new Error("Failed to create tag");
    }

    return {
      id: data.id,
      name: data.name,
      created_at: data.created_at,
    };
  }
}

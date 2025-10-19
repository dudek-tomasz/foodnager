/**
 * UnitsService - Business logic for Units Dictionary API
 * 
 * Handles retrieval of measurement units from the database.
 * Units are global (not user-specific) and rarely change, making them
 * ideal candidates for aggressive caching.
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type { UnitDTO } from '../../types';

/**
 * UnitsService class
 * Provides methods for fetching measurement units
 */
export class UnitsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists all available measurement units
   * Returns units sorted alphabetically by name
   * 
   * @returns Array of all units in the system
   * @throws Error if database query fails
   */
  async listUnits(): Promise<UnitDTO[]> {
    const { data, error } = await this.supabase
      .from('units')
      .select('id, name, abbreviation, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching units:', error);
      throw new Error('Failed to fetch units');
    }

    // Transform to UnitDTO (though structure is already correct)
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      created_at: row.created_at,
    }));
  }
}


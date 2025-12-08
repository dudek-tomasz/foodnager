/**
 * Custom hook for fetching and managing units list
 */

import { useState, useEffect } from "react";
import type { UnitDTO, UnitsListResponseDTO } from "@/types";

/**
 * Hook do pobierania listy jednostek
 *
 * @returns Lista jednostek i stan ładowania
 */
export function useUnits() {
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUnits() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/units");

        if (!response.ok) {
          throw new Error("Failed to fetch units");
        }

        const data: UnitsListResponseDTO = await response.json();
        setUnits(data.data);
      } catch (err) {
        // Error fetching units - log to monitoring service in production
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch units:", err);
        }
        setError("Nie udało się pobrać jednostek");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUnits();
  }, []);

  return { units, isLoading, error };
}

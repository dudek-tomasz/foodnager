/**
 * Cooking History API Client
 * Client-side functions for cooking history-related API calls
 */

import { apiClient } from "../api-client";
import type {
  CookingHistoryDTO,
  CreateCookingHistoryDTO,
  CreateCookingHistoryResponseDTO,
  CookingHistoryListResponseDTO,
  ListCookingHistoryQueryDTO,
} from "../../types";

/**
 * Tworzy wpis historii gotowania i aktualizuje lodówkę
 * @param data - Dane gotowania (recipe_id)
 * @returns Utworzony wpis z informacjami o zmianie lodówki
 * @throws ApiError jeśli brak składników (422) lub przepis nie istnieje (404)
 */
export async function cookRecipe(data: CreateCookingHistoryDTO): Promise<CreateCookingHistoryResponseDTO> {
  return apiClient.post<CreateCookingHistoryResponseDTO>("/api/cooking-history", data);
}

/**
 * Pobiera historię gotowania użytkownika
 * @param query - Opcjonalne parametry filtrowania i paginacji
 * @returns Lista wpisów historii gotowania
 */
export async function fetchCookingHistory(query?: ListCookingHistoryQueryDTO): Promise<CookingHistoryListResponseDTO> {
  return apiClient.get<CookingHistoryListResponseDTO>("/api/cooking-history", query);
}

/**
 * Pobiera pojedynczy wpis historii gotowania
 * @param historyId - ID wpisu
 * @returns Szczegóły wpisu historii
 */
export async function fetchCookingHistoryEntry(historyId: number): Promise<CookingHistoryDTO> {
  return apiClient.get<CookingHistoryDTO>(`/api/cooking-history/${historyId}`);
}

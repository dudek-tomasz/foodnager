/**
 * Fridge API Client
 * Client-side functions for fridge-related API calls
 */

import { apiClient } from "../api-client";
import type {
  FridgeItemDTO,
  FridgeListResponseDTO,
  ListFridgeQueryDTO,
  CreateFridgeItemDTO,
  UpdateFridgeItemDTO,
} from "../../types";

/**
 * Pobiera wszystkie produkty z lodówki użytkownika
 * @param query - Opcjonalne parametry filtrowania i paginacji
 * @returns Lista produktów z lodówki
 */
export async function fetchFridgeItems(query?: ListFridgeQueryDTO): Promise<FridgeListResponseDTO> {
  return apiClient.get<FridgeListResponseDTO>("/api/fridge", query);
}

/**
 * Pobiera wszystkie produkty z lodówki bez paginacji (dla sprawdzania dostępności)
 * @returns Lista wszystkich produktów z lodówki
 */
export async function fetchAllFridgeItems(): Promise<FridgeItemDTO[]> {
  const response = await apiClient.get<FridgeListResponseDTO>("/api/fridge", {
    limit: 1000, // Wysoki limit aby pobrać wszystkie
  });
  return response.data;
}

/**
 * Pobiera pojedynczy produkt z lodówki
 * @param itemId - ID produktu w lodówce
 * @returns Szczegóły produktu
 */
export async function fetchFridgeItem(itemId: number): Promise<FridgeItemDTO> {
  return apiClient.get<FridgeItemDTO>(`/api/fridge/${itemId}`);
}

/**
 * Dodaje produkt do lodówki
 * @param item - Dane produktu do dodania
 * @returns Utworzony produkt w lodówce
 */
export async function createFridgeItem(item: CreateFridgeItemDTO): Promise<FridgeItemDTO> {
  return apiClient.post<FridgeItemDTO>("/api/fridge", item);
}

/**
 * Aktualizuje produkt w lodówce
 * @param itemId - ID produktu w lodówce
 * @param updates - Dane do aktualizacji
 * @returns Zaktualizowany produkt
 */
export async function updateFridgeItem(itemId: number, updates: UpdateFridgeItemDTO): Promise<FridgeItemDTO> {
  return apiClient.patch<FridgeItemDTO>(`/api/fridge/${itemId}`, updates);
}

/**
 * Usuwa produkt z lodówki
 * @param itemId - ID produktu w lodówce
 */
export async function deleteFridgeItem(itemId: number): Promise<void> {
  await apiClient.delete(`/api/fridge/${itemId}`);
}

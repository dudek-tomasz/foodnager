/**
 * Funkcje pomocnicze dla Shopping List Modal
 * Formatowanie i eksport listy zakupów
 */

import type { EditableShoppingListItem } from './types';

/**
 * Formatuje listę zakupów do plain text
 * @param items - Lista składników
 * @param recipeTitle - Tytuł przepisu
 * @returns Sformatowany tekst listy zakupów
 */
export function formatForClipboard(
  items: EditableShoppingListItem[],
  recipeTitle: string
): string {
  // Walidacja wejścia
  if (!items || items.length === 0) {
    return '';
  }

  const checkedItems = items.filter((item) => item.checked);

  if (checkedItems.length === 0) {
    return '';
  }

  // Fallback dla pustego tytułu
  const safeTitle = recipeTitle && recipeTitle.trim() !== '' ? recipeTitle : 'Przepis';

  const header = `Lista zakupów: ${safeTitle}\n\n`;
  const itemsList = checkedItems
    .map((item) => {
      // Walidacja danych pozycji
      const quantity = item.editedQuantity || item.missing_quantity || 0;
      const unit = item.unit?.abbreviation || item.unit?.name || '';
      const name = item.product?.name || 'Produkt';
      
      return `- ${quantity} ${unit} ${name}`;
    })
    .join('\n');

  return header + itemsList;
}

/**
 * Kopiuje tekst do schowka z fallback dla starszych przeglądarek
 * @param text - Tekst do skopiowania
 * @returns Promise z sukcesem operacji
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback: textarea trick
      return fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error('Clipboard error:', error);
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback method dla kopiowania do schowka (dla starszych przeglądarek)
 * @param text - Tekst do skopiowania
 * @returns Czy operacja się powiodła
 */
function fallbackCopyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (error) {
    console.error('Fallback copy error:', error);
    document.body.removeChild(textarea);
    return false;
  }
}

/**
 * Tworzy slug z tekstu (dla nazw plików)
 * @param text - Tekst do przekształcenia
 * @returns Slug (lowercase, bez znaków specjalnych)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Eksportuje listę zakupów do pliku .txt
 * @param items - Lista składników
 * @param recipeTitle - Tytuł przepisu
 */
export function exportToTxtFile(
  items: EditableShoppingListItem[],
  recipeTitle: string
): void {
  const content = formatForClipboard(items, recipeTitle);
  
  if (!content || content.trim() === '') {
    console.warn('No content to export');
    return;
  }

  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    
    // Fallback dla pustego tytułu w nazwie pliku
    const safeTitle = recipeTitle && recipeTitle.trim() !== '' ? recipeTitle : 'przepis';
    link.download = `lista-zakupow-${slugify(safeTitle)}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Export to txt file error:', error);
    throw error;
  }
}

/**
 * Przygotowuje stronę do drukowania i wywołuje dialog drukowania
 */
export function printShoppingList(): void {
  window.print();
}


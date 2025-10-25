/**
 * ShoppingListItem - Pojedynczy wiersz brakującego składnika
 * 
 * Komponent zawiera checkbox, nazwę produktu, edytowalną ilość, jednostkę
 * oraz przycisk usunięcia. Obsługuje walidację ilości inline.
 */

import { useState, useEffect } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ShoppingListItemProps } from './types';

/**
 * Pojedyncza pozycja na liście zakupów
 */
export function ShoppingListItem({
  item,
  onCheckedChange,
  onQuantityChange,
  onRemove,
}: ShoppingListItemProps) {
  // Local state dla wartości input (do debouncing)
  const [inputValue, setInputValue] = useState(item.editedQuantity.toString());
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // Sync local state z props gdy item się zmieni z zewnątrz
  useEffect(() => {
    setInputValue(item.editedQuantity.toString());
  }, [item.editedQuantity]);

  /**
   * Waliduje wartość ilości
   */
  const validateQuantity = (value: string): boolean => {
    const numValue = parseFloat(value);

    if (value.trim() === '' || isNaN(numValue)) {
      setQuantityError('Wprowadź liczbę');
      return false;
    }

    if (numValue <= 0) {
      setQuantityError('Ilość > 0');
      return false;
    }

    if (numValue > 9999) {
      setQuantityError('Max 9999');
      return false;
    }

    setQuantityError(null);
    return true;
  };

  /**
   * Obsługuje zmianę wartości w input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Walidacja na bieżąco
    if (validateQuantity(value)) {
      const numValue = parseFloat(value);
      onQuantityChange(numValue);
    }
  };

  /**
   * Obsługuje blur - ostateczna walidacja
   */
  const handleInputBlur = () => {
    if (!validateQuantity(inputValue)) {
      // Reset do ostatniej poprawnej wartości
      setInputValue(item.editedQuantity.toString());
      setQuantityError(null);
    }
  };

  /**
   * Obsługuje Enter key - zapisz i usuń focus
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={cn(
        'shopping-list-item flex items-center gap-3 p-3 rounded-lg border bg-card transition-all duration-200',
        !item.checked && 'opacity-50 scale-[0.98]',
        item.checked && 'hover:shadow-sm'
      )}
      role="listitem"
    >
      {/* Checkbox */}
      <div className="shopping-list-checkbox flex-shrink-0">
        <Checkbox
          checked={item.checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
          aria-label={`Zaznacz ${item.product.name}`}
        />
      </div>

      {/* Nazwa produktu */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium truncate',
            !item.checked && 'line-through text-muted-foreground'
          )}
        >
          {item.product.name}
        </p>
        {item.available_quantity > 0 && (
          <p className="text-xs text-muted-foreground">
            Masz: {item.available_quantity} {item.unit.abbreviation}
          </p>
        )}
      </div>

      {/* Edytowalna ilość */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-20 text-center',
              quantityError && 'border-destructive focus:ring-destructive'
            )}
            min={0.01}
            max={9999}
            step={0.1}
            aria-label={`Ilość ${item.product.name}`}
            aria-invalid={quantityError !== null}
            aria-describedby={quantityError ? `error-${item.id}` : undefined}
            disabled={!item.checked}
          />
          {quantityError && (
            <span
              id={`error-${item.id}`}
              className="absolute -bottom-5 left-0 text-xs text-destructive whitespace-nowrap"
            >
              {quantityError}
            </span>
          )}
        </div>

        {/* Jednostka */}
        <span className="text-sm text-muted-foreground min-w-[3ch] text-center">
          {item.unit.abbreviation}
        </span>
      </div>

      {/* Przycisk usunięcia */}
      <div className="shopping-list-remove-button flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`Usuń ${item.product.name} z listy`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


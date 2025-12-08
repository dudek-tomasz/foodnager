/**
 * UnitSelect - Dropdown for selecting measurement unit
 *
 * Features:
 * - Display unit name with abbreviation
 * - Loading state
 * - Error handling
 * - Integration with useUnits hook
 */

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnits } from "./hooks/useUnits";
import type { UnitDTO } from "@/types";

interface UnitSelectProps {
  value: number | null;
  onChange: (unitId: number) => void;
  error?: string;
  disabled?: boolean;
  testId?: string;
}

export default function UnitSelect({
  value,
  onChange,
  error,
  disabled = false,
  testId = "unit-select",
}: UnitSelectProps) {
  const { units, isLoading, error: fetchError } = useUnits();

  const handleValueChange = (val: string) => {
    onChange(parseInt(val, 10));
  };

  // Show error state
  if (fetchError) {
    return (
      <div className="space-y-2">
        <div className="w-full px-3 py-2 border border-red-500 rounded-md bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          Nie udało się załadować jednostek
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 animate-pulse">
          Ładowanie jednostek...
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Show empty state
  if (units.length === 0) {
    return (
      <div className="space-y-2">
        <div className="w-full px-3 py-2 border border-orange-500 rounded-md bg-orange-50 dark:bg-orange-900/20 text-sm text-orange-600 dark:text-orange-400">
          Brak dostępnych jednostek. Skontaktuj się z administratorem.
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={value?.toString()} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full ${error ? "border-red-500" : ""}`}
          aria-label="Wybierz jednostkę"
          data-testid={`${testId}-trigger`}
        >
          <SelectValue placeholder="Wybierz jednostkę...">
            {value && units.find((u) => u.id === value) ? (
              <span>
                {units.find((u) => u.id === value)?.name} ({units.find((u) => u.id === value)?.abbreviation})
              </span>
            ) : (
              "Wybierz jednostkę..."
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent data-testid={`${testId}-content`}>
          {units.map((unit: UnitDTO) => (
            <SelectItem key={unit.id} value={unit.id.toString()} data-testid={`${testId}-option-${unit.id}`}>
              <div className="flex items-center justify-between w-full gap-2">
                <span>{unit.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {unit.abbreviation}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

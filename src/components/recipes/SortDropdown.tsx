/**
 * SortDropdown Component
 *
 * Dropdown for selecting sort field and order.
 * Shows current sort option with ascending/descending icon.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortOption } from "./types";

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

const SORT_OPTIONS = [
  { field: "created_at" as const, label: "Data dodania" },
  { field: "title" as const, label: "Nazwa (A-Z)" },
  { field: "cooking_time" as const, label: "Czas gotowania" },
  { field: "difficulty" as const, label: "Trudność" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const handleFieldChange = (field: string) => {
    onChange({
      field: field as SortOption["field"],
      order: value.order,
    });
  };

  const toggleOrder = () => {
    onChange({
      ...value,
      order: value.order === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={value.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sortuj po..." />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.field} value={option.field}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleOrder}
        className="px-2"
        aria-label={value.order === "asc" ? "Rosnąco" : "Malejąco"}
        title={value.order === "asc" ? "Rosnąco" : "Malejąco"}
      >
        {value.order === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * DatePicker - Simple date picker for expiry date selection
 * 
 * Uses HTML5 date input with styling
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  error?: string;
  disabled?: boolean;
  minDate?: string;
  showClearButton?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  error,
  disabled = false,
  minDate,
  showClearButton = true,
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
  };

  const handleClear = () => {
    onChange(null);
  };

  // Format date for display (if needed)
  const displayValue = value || '';

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="date"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          min={minDate}
          className={`flex-1 ${error ? 'border-red-500' : ''}`}
          aria-label="Wybierz datę ważności"
        />
        
        {showClearButton && value && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-shrink-0"
            title="Usuń datę"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>
      
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


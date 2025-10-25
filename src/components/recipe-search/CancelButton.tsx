/**
 * CancelButton - Button to cancel ongoing search
 * 
 * Allows user to abort the current search operation
 */

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CancelButtonProps {
  onCancel: () => void;
  disabled?: boolean;
}

export default function CancelButton({ onCancel, disabled = false }: CancelButtonProps) {
  return (
    <div className="flex justify-center mt-8">
      <Button
        variant="destructive"
        onClick={onCancel}
        disabled={disabled}
        className="gap-2"
      >
        <X className="h-4 w-4" />
        Anuluj wyszukiwanie
      </Button>
    </div>
  );
}


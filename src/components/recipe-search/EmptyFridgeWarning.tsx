/**
 * EmptyFridgeWarning - Warning displayed when fridge is empty
 *
 * Informs user that search will be less precise and encourages adding products
 */

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFridgeWarningProps {
  onAddProducts: () => void;
}

export default function EmptyFridgeWarning({ onAddProducts }: EmptyFridgeWarningProps) {
  return (
    <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-300 rounded-lg">
      <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-yellow-900 font-medium mb-2">
          Twoja lodówka jest pusta. Wyszukiwanie będzie mniej precyzyjne.
        </p>
        <Button variant="outline" size="sm" onClick={onAddProducts} className="bg-white hover:bg-yellow-50">
          Dodaj produkty
        </Button>
      </div>
    </div>
  );
}

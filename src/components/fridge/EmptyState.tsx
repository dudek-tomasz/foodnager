/**
 * EmptyState - Component displayed when fridge is empty
 *
 * Shows a helpful message and CTA button to add first product
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddFirst: () => void;
}

export default function EmptyState({ onAddFirst }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration/Icon */}
      <div className="mb-6 text-gray-400 dark:text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          {/* Fridge icon - simplified refrigerator */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 4v16m8-16v16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zm0 7h16"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Twoja lodówka jest pusta</h2>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Zacznij dodawać produkty do swojej wirtualnej lodówki, aby śledzić ich ilości i daty ważności. To pomoże Ci
        znaleźć idealne przepisy!
      </p>

      {/* CTA Button */}
      <Button onClick={onAddFirst} size="lg" className="mt-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Dodaj pierwszy produkt
      </Button>

      {/* Additional info */}
      <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
        <p>💡 Wskazówka: Możesz dodawać zarówno produkty globalne, jak i własne.</p>
      </div>
    </div>
  );
}

/**
 * FridgeItem - Single fridge item display component
 *
 * Displays product information with:
 * - Product name
 * - Quantity and unit
 * - Expiry date badge with color coding
 * - Quick actions (edit, delete)
 */

import React from "react";
import { Button } from "@/components/ui/button";
import ExpiryDateBadge from "./ExpiryDateBadge";
import type { FridgeItemDTO } from "@/types";

interface FridgeItemProps {
  item: FridgeItemDTO;
  onEdit: (itemId: number) => void;
  onDelete: (itemId: number) => void;
}

export default function FridgeItem({ item, onEdit, onDelete }: FridgeItemProps) {
  return (
    <li className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          {/* Product Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{item.product.name}</h3>

            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                {item.quantity} {item.unit.abbreviation}
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-xs">{item.unit.name}</span>
            </div>

            {/* Expiry Date Badge */}
            <div className="mt-2">
              <ExpiryDateBadge expiryDate={item.expiry_date} showDaysCount />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item.id)}
          className="h-9 w-9 p-0"
          aria-label={`Edytuj ${item.product.name}`}
          title="Edytuj produkt"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
          aria-label={`Usuń ${item.product.name}`}
          title="Usuń produkt"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </Button>
      </div>
    </li>
  );
}

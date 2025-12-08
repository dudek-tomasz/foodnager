/**
 * StickyBottomBar - Sticky action bar that appears on scroll
 */

import React from "react";
import { Button } from "@/components/ui/button";
import type { SourceEnum } from "../../types";

interface StickyBottomBarProps {
  source: SourceEnum;
  isVisible: boolean;
  onCook: () => void;
  onSave: () => void;
  isCooking?: boolean;
  isSaving?: boolean;
}

export default function StickyBottomBar({
  source,
  isVisible,
  onCook,
  onSave,
  isCooking = false,
  isSaving = false,
}: StickyBottomBarProps) {
  const isUserRecipe = source === "user";

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      aria-hidden={!isVisible}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Cook button - always visible */}
          <Button size="lg" onClick={onCook} disabled={isCooking} className="flex-1 sm:flex-initial sm:min-w-[200px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {isCooking ? "Gotowanie..." : "Ugotuj to"}
          </Button>

          {/* Save button - only for external recipes */}
          {!isUserRecipe && (
            <Button
              size="lg"
              variant="secondary"
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 sm:flex-initial sm:min-w-[200px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {isSaving ? "Zapisywanie..." : "Zapisz przepis"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

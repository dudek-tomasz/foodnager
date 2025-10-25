/**
 * ErrorState - Reusable error display component
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function ErrorState({
  error,
  onRetry,
  showBackButton = false,
  onBack,
  className = '',
}: ErrorStateProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="mb-6 text-red-400 dark:text-red-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Wystąpił błąd
      </h2>

      {/* Error message */}
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {error}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} size="lg">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Spróbuj ponownie
          </Button>
        )}

        {showBackButton && (
          <Button onClick={handleBack} variant="outline" size="lg">
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Wróć
          </Button>
        )}
      </div>
    </div>
  );
}


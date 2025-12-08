/**
 * LoadingSpinner - Reusable loading indicator component
 */

import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ message = "Ładowanie...", size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`} role="status" aria-live="polite">
      {/* Spinner */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-primary`}
          aria-hidden="true"
        />
      </div>

      {/* Message */}
      {message && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>}

      {/* Screen reader text */}
      <span className="sr-only">{message}</span>
    </div>
  );
}

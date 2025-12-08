/**
 * BackButton - Navigation button to go back
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  from?: string;
  onClick?: () => void;
}

export default function BackButton({ from, onClick }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  // Dynamiczny tekst zależny od źródła nawigacji
  const getButtonText = () => {
    if (from === "search") return "Wróć do wyników";
    if (from === "list") return "Wróć do przepisów";
    if (from === "history") return "Wróć do historii";
    return "Wróć";
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className="gap-2" aria-label={getButtonText()}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {getButtonText()}
    </Button>
  );
}

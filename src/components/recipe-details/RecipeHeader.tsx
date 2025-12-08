/**
 * RecipeHeader - Recipe page header with navigation, title, badges and actions
 */

import React from "react";
import BackButton from "./BackButton";
import SourceBadge from "./SourceBadge";
import MatchScoreBadge from "./MatchScoreBadge";
import RecipeActionsDropdown from "./RecipeActionsDropdown";
import type { SourceEnum } from "../../types";

interface RecipeHeaderProps {
  title: string;
  source: SourceEnum;
  matchScore?: number;
  from?: string;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function RecipeHeader({
  title,
  source,
  matchScore,
  from,
  onEdit,
  onDelete,
  onSave,
  onBack,
  isLoading = false,
}: RecipeHeaderProps) {
  return (
    <header className="mb-6">
      {/* Navigation and actions row */}
      <div className="flex items-center justify-between mb-4">
        <BackButton from={from} onClick={onBack} />
        <RecipeActionsDropdown
          source={source}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
          disabled={isLoading}
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h1>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={source} />
        {matchScore !== undefined && <MatchScoreBadge matchScore={matchScore} />}
      </div>
    </header>
  );
}

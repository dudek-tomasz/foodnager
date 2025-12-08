/**
 * SourceCard - Interactive card for selecting recipe source
 *
 * Displays a source option with icon, title, description, and optional badge
 */

import React from "react";
import { BookOpen, Globe, Sparkles, Search } from "lucide-react";
import type { RecipeSource } from "@/types/recipe-search.types";
import { Badge } from "@/components/ui/badge";

interface SourceCardProps {
  source: RecipeSource;
  title: string;
  description: string;
  icon: string;
  badge?: number;
  onClick: (source: RecipeSource) => void;
}

// Map icon names to lucide-react components
const iconMap = {
  BookOpen,
  Globe,
  Sparkles,
  Search,
};

export default function SourceCard({ source, title, description, icon, badge, onClick }: SourceCardProps) {
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Search;

  return (
    <button
      onClick={() => onClick(source)}
      className="relative w-full h-[200px] p-6 bg-white border-2 border-gray-200 rounded-xl 
                 hover:border-blue-500 hover:shadow-lg hover:scale-[1.02]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-all duration-200 text-left group"
      aria-label={`Wybierz źródło: ${title}`}
    >
      {/* Badge (only for user recipes) */}
      {badge !== undefined && (
        <Badge variant="secondary" className="absolute top-4 right-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
          {badge}
        </Badge>
      )}

      {/* Icon */}
      <div className="mb-4">
        <IconComponent
          className="h-16 w-16 text-blue-600 group-hover:text-blue-700 transition-colors"
          strokeWidth={1.5}
        />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
    </button>
  );
}

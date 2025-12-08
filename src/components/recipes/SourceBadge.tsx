/**
 * SourceBadge Component
 *
 * Displays a badge indicating the source of a recipe (USER, API, or AI)
 * with appropriate color coding and optional icon.
 */

import { Badge } from "@/components/ui/badge";
import type { SourceEnum } from "@/types";

interface SourceBadgeProps {
  source: SourceEnum;
}

const SOURCE_CONFIG = {
  user: {
    label: "MOJE",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  api: {
    label: "API",
    className: "bg-purple-500 hover:bg-purple-600 text-white",
  },
  ai: {
    label: "AI",
    className: "bg-orange-500 hover:bg-orange-600 text-white",
  },
} as const;

export function SourceBadge({ source }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source];

  return (
    <Badge className={config.className} variant="default">
      {config.label}
    </Badge>
  );
}

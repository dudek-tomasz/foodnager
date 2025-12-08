/**
 * TagBadge - Badge displaying a single tag
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { TagDTO } from "../../types";

interface TagBadgeProps {
  tag: TagDTO;
  onClick?: (tag: TagDTO) => void;
}

export default function TagBadge({ tag, onClick }: TagBadgeProps) {
  const handleClick = onClick ? () => onClick(tag) : undefined;

  return (
    <Badge variant="secondary" className={onClick ? "cursor-pointer hover:bg-gray-300" : ""} onClick={handleClick}>
      {tag.name}
    </Badge>
  );
}

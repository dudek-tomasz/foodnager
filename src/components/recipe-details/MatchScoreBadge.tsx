/**
 * MatchScoreBadge - Badge showing match score from search results
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getMatchScoreColor } from '../../lib/utils/recipe-utils';

interface MatchScoreBadgeProps {
  matchScore: number;
}

export default function MatchScoreBadge({ matchScore }: MatchScoreBadgeProps) {
  const percentage = Math.round(matchScore * 100);
  const colorClass = getMatchScoreColor(percentage);

  return (
    <Badge className={`border ${colorClass}`} variant="outline">
      Dopasowanie: {percentage}%
    </Badge>
  );
}


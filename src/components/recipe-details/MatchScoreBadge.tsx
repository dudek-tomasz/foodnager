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
  const colorClass = getMatchScoreColor(matchScore);

  return (
    <Badge className={`border ${colorClass}`} variant="outline">
      Dopasowanie: {Math.round(matchScore)}%
    </Badge>
  );
}


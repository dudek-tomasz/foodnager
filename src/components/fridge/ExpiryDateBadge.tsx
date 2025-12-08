/**
 * ExpiryDateBadge - Component displaying expiry date with color coding
 *
 * Color coding:
 * - Green (fresh): > 3 days until expiry
 * - Orange (expiring-soon): <= 3 days until expiry
 * - Red (expired): past expiry date
 * - Gray (no-expiry): no expiry date set
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { getExpiryStatus, formatExpiryDate, getDaysUntilExpiry } from "@/lib/utils/expiry-status";
import type { ExpiryStatus } from "@/types";

interface ExpiryDateBadgeProps {
  expiryDate: string | null;
  showDaysCount?: boolean;
}

/**
 * Mapowanie statusu na variant Badge
 */
const STATUS_VARIANT_MAP: Record<ExpiryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  expired: "destructive",
  "expiring-soon": "outline", // Will add custom orange styling
  fresh: "default", // Will add custom green styling
  "no-expiry": "secondary",
};

/**
 * Mapowanie statusu na custom classes
 */
const STATUS_CLASS_MAP: Record<ExpiryStatus, string> = {
  expired: "",
  "expiring-soon": "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  fresh: "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  "no-expiry": "",
};

export default function ExpiryDateBadge({ expiryDate, showDaysCount = false }: ExpiryDateBadgeProps) {
  const status = getExpiryStatus(expiryDate);
  const variant = STATUS_VARIANT_MAP[status];
  const customClass = STATUS_CLASS_MAP[status];
  const formattedDate = formatExpiryDate(expiryDate);
  const daysUntil = getDaysUntilExpiry(expiryDate);

  // Build display text
  let displayText = formattedDate;
  if (showDaysCount && daysUntil !== null) {
    if (daysUntil < 0) {
      displayText = `${formattedDate} (przeterminowany)`;
    } else if (daysUntil === 0) {
      displayText = `${formattedDate} (dzisiaj)`;
    } else if (daysUntil === 1) {
      displayText = `${formattedDate} (jutro)`;
    } else if (daysUntil <= 3) {
      displayText = `${formattedDate} (${daysUntil} dni)`;
    }
  }

  return (
    <Badge variant={variant} className={customClass} aria-label={`Data ważności: ${formattedDate}`}>
      {displayText}
    </Badge>
  );
}

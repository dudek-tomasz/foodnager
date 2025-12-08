import { Clock } from "lucide-react";
import { formatCookingDate } from "../../lib/mappers/cooking-history-view.mapper";

interface DateTimeHeaderProps {
  date: string; // ISO timestamp
  format?: "relative" | "absolute";
}

/**
 * Komponent wyświetlający datę i czas w czytelnym, relatywnym formacie
 */
export function DateTimeHeader({ date, format = "relative" }: DateTimeHeaderProps) {
  const formattedDate =
    format === "relative"
      ? formatCookingDate(date)
      : new Date(date).toLocaleString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span>{formattedDate}</span>
    </div>
  );
}

import { ChevronDown, ArrowDown } from "lucide-react";
import { FridgeStateDisplay } from "./FridgeStateDisplay";
import { Button } from "@/components/ui/button";
import type { FridgeStateDTO } from "../../types";
import { cn } from "@/lib/utils";

interface ExpandableDetailsProps {
  fridgeStateBefore: FridgeStateDTO;
  fridgeStateAfter: FridgeStateDTO;
  isExpanded: boolean;
  onToggle: () => void;
  changedProducts?: number[];
}

/**
 * Sekcja zawierająca szczegóły stanu lodówki przed i po gotowaniu,
 * z możliwością zwijania/rozwijania
 */
export function ExpandableDetails({
  fridgeStateBefore,
  fridgeStateAfter,
  isExpanded,
  onToggle,
  changedProducts = [],
}: ExpandableDetailsProps) {
  return (
    <div className="border-t pt-4 mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full justify-between"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium">{isExpanded ? "Ukryj szczegóły" : "Pokaż szczegóły"}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-6">
          <FridgeStateDisplay state={fridgeStateBefore} type="before" changedProducts={changedProducts} />

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-px bg-border flex-1 w-12" />
              <ArrowDown className="h-5 w-5" />
              <div className="h-px bg-border flex-1 w-12" />
            </div>
          </div>

          <FridgeStateDisplay state={fridgeStateAfter} type="after" changedProducts={changedProducts} />

          {changedProducts.length > 0 && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{changedProducts.length}</span> produktów zostało zużytych
                podczas gotowania
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

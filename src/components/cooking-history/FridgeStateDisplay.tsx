import type { FridgeStateDTO } from '../../types';
import { cn } from '@/lib/utils';

interface FridgeStateDisplayProps {
  state: FridgeStateDTO;
  type: 'before' | 'after';
  changedProducts?: number[];
}

/**
 * Komponent wyświetlający szczegółowy stan lodówki (przed lub po gotowaniu)
 */
export function FridgeStateDisplay({ state, type, changedProducts = [] }: FridgeStateDisplayProps) {
  const title = type === 'before' ? 'Stan lodówki przed' : 'Stan lodówki po';

  if (state.items.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground italic">Brak produktów</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {state.items.map((item) => {
          const isChanged = changedProducts.includes(item.product_id);
          
          return (
            <li
              key={item.product_id}
              className={cn(
                'flex items-center justify-between p-2 rounded-md border text-sm',
                isChanged && 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
              )}
            >
              <span className="font-medium">{item.product_name}</span>
              <span className="text-muted-foreground">
                {item.quantity} {item.unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


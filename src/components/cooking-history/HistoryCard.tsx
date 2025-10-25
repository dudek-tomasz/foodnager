import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateTimeHeader } from './DateTimeHeader';
import { UsedIngredientsPreview } from './UsedIngredientsPreview';
import { ExpandableDetails } from './ExpandableDetails';
import type { CookingHistoryDTO } from '../../types';
import { calculateChangedProducts } from '../../lib/mappers/cooking-history-view.mapper';

interface HistoryCardProps {
  entry: CookingHistoryDTO;
  onRecipeClick: (id: number) => void;
  onCookAgain: (id: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: (id: number) => void;
}

/**
 * Karta pojedynczego wydarzenia gotowania z datą, czasem, przepisem, 
 * składnikami i rozwijalnymi szczegółami stanu lodówki
 */
export function HistoryCard({ 
  entry, 
  onRecipeClick, 
  onCookAgain,
  isExpanded: isExpandedProp,
  onToggleExpand
}: HistoryCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  
  // Używamy external state jeśli dostępny, inaczej local state
  const isExpanded = isExpandedProp ?? localExpanded;
  
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(entry.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  const changedProducts = calculateChangedProducts(
    entry.fridge_state_before,
    entry.fridge_state_after
  );

  const handleRecipeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRecipeClick(entry.recipe.id);
  };

  const handleCookAgain = () => {
    onCookAgain(entry.recipe.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary">
      <CardHeader className="space-y-3">
        <DateTimeHeader date={entry.cooked_at} />
        
        <button
          onClick={handleRecipeClick}
          className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          <h3 className="text-xl font-semibold">{entry.recipe.title}</h3>
        </button>

        <UsedIngredientsPreview 
          ingredients={entry.fridge_state_before.items} 
          maxDisplay={3}
        />
      </CardHeader>

      <CardContent>
        <ExpandableDetails
          fridgeStateBefore={entry.fridge_state_before}
          fridgeStateAfter={entry.fridge_state_after}
          isExpanded={isExpanded}
          onToggle={handleToggle}
          changedProducts={changedProducts}
        />
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleCookAgain}
          variant="default"
          className="w-full sm:w-auto"
        >
          <ChefHat className="w-4 h-4 mr-2" />
          Ugotuj ponownie
        </Button>
      </CardFooter>
    </Card>
  );
}


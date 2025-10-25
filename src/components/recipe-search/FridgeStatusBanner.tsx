/**
 * FridgeStatusBanner - Displays current fridge status
 * 
 * Shows the number of items currently in user's virtual fridge
 */

import React from 'react';
import { Refrigerator } from 'lucide-react';

interface FridgeStatusBannerProps {
  itemCount: number;
}

export default function FridgeStatusBanner({ itemCount }: FridgeStatusBannerProps) {
  return (
    <div className="flex items-center gap-3 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
      <Refrigerator className="h-6 w-6 text-blue-600 flex-shrink-0" />
      <p className="text-blue-900 font-medium">
        W Twojej lodówce: <span className="font-bold">{itemCount}</span>{' '}
        {itemCount === 1 ? 'produkt' : itemCount < 5 ? 'produkty' : 'produktów'}
      </p>
    </div>
  );
}


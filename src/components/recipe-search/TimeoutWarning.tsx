/**
 * TimeoutWarning - Warning shown when search takes too long
 * 
 * Displayed after 30 seconds of searching
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function TimeoutWarning() {
  return (
    <div 
      className="flex items-center gap-3 p-4 mb-6 bg-orange-50 border border-orange-300 rounded-lg"
      role="alert"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 text-orange-600 animate-spin flex-shrink-0" />
      <p className="text-orange-900 font-medium">
        Generowanie trwa dłużej niż zwykle... Proszę czekać.
      </p>
    </div>
  );
}


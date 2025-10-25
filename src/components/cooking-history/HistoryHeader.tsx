import { History } from 'lucide-react';
import type { HistoryStats } from './types';

interface HistoryHeaderProps {
  stats: HistoryStats;
}

/**
 * Header widoku z tytułem strony oraz statystykami historii
 */
export function HistoryHeader({ stats }: HistoryHeaderProps) {
  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    return new Date(isoDate).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <header className="space-y-4 mb-8">
      <div className="flex items-center gap-3">
        <History className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Historia gotowania</h1>
      </div>
      
      <p className="text-muted-foreground">
        Przeglądaj przepisy, które ugotowałeś
      </p>

      {stats.totalEntries > 0 && (
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Liczba wpisów: </span>
            <span className="font-semibold">{stats.totalEntries}</span>
          </div>
          
          {stats.newestDate && (
            <div>
              <span className="text-muted-foreground">Ostatnie gotowanie: </span>
              <span className="font-semibold">{formatDate(stats.newestDate)}</span>
            </div>
          )}

          {stats.oldestDate && stats.totalEntries > 1 && (
            <div>
              <span className="text-muted-foreground">Pierwsze gotowanie: </span>
              <span className="font-semibold">{formatDate(stats.oldestDate)}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}


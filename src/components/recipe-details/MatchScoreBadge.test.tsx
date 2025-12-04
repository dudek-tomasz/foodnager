/**
 * Testy jednostkowe dla komponentu MatchScoreBadge
 * 
 * Zakres testów:
 * - Renderowanie komponentu
 * - Konwersja wartości matchScore na procenty
 * - Zastosowanie właściwych kolorów na podstawie wartości procentowej
 * - Obsługa warunków brzegowych
 * - Zaokrąglanie wartości
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import MatchScoreBadge from './MatchScoreBadge';

describe('MatchScoreBadge', () => {
  // =============================================================================
  // PODSTAWOWE RENDEROWANIE
  // =============================================================================

  describe('Renderowanie', () => {
    it('powinien renderować badge z poprawnym tekstem', () => {
      render(<MatchScoreBadge matchScore={0.75} />);
      
      const badge = screen.getByText(/Dopasowanie:/i);
      expect(badge).toBeInTheDocument();
    });

    it('powinien wyświetlać wartość procentową w tekście', () => {
      render(<MatchScoreBadge matchScore={0.75} />);
      
      expect(screen.getByText('Dopasowanie: 75%')).toBeInTheDocument();
    });

    it('powinien renderować jako Badge z wariantem outline', () => {
      const { container } = render(<MatchScoreBadge matchScore={0.75} />);
      
      // Badge z shadcn/ui powinien mieć określone klasy
      const badge = container.querySelector('[class*="border"]');
      expect(badge).toBeInTheDocument();
    });
  });

  // =============================================================================
  // KONWERSJA WARTOŚCI NA PROCENTY
  // =============================================================================

  describe('Konwersja wartości matchScore na procenty', () => {
    it('powinien konwertować 0 na 0%', () => {
      render(<MatchScoreBadge matchScore={0} />);
      expect(screen.getByText('Dopasowanie: 0%')).toBeInTheDocument();
    });

    it('powinien konwertować 0.25 na 25%', () => {
      render(<MatchScoreBadge matchScore={0.25} />);
      expect(screen.getByText('Dopasowanie: 25%')).toBeInTheDocument();
    });

    it('powinien konwertować 0.5 na 50%', () => {
      render(<MatchScoreBadge matchScore={0.5} />);
      expect(screen.getByText('Dopasowanie: 50%')).toBeInTheDocument();
    });

    it('powinien konwertować 0.75 na 75%', () => {
      render(<MatchScoreBadge matchScore={0.75} />);
      expect(screen.getByText('Dopasowanie: 75%')).toBeInTheDocument();
    });

    it('powinien konwertować 1 na 100%', () => {
      render(<MatchScoreBadge matchScore={1} />);
      expect(screen.getByText('Dopasowanie: 100%')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // ZAOKRĄGLANIE WARTOŚCI
  // =============================================================================

  describe('Zaokrąglanie wartości procentowej', () => {
    it('powinien zaokrąglić 0.745 do 75%', () => {
      render(<MatchScoreBadge matchScore={0.745} />);
      expect(screen.getByText('Dopasowanie: 75%')).toBeInTheDocument();
    });

    it('powinien zaokrąglić 0.746 do 75%', () => {
      render(<MatchScoreBadge matchScore={0.746} />);
      expect(screen.getByText('Dopasowanie: 75%')).toBeInTheDocument();
    });

    it('powinien zaokrąglić 0.755 do 76%', () => {
      render(<MatchScoreBadge matchScore={0.755} />);
      expect(screen.getByText('Dopasowanie: 76%')).toBeInTheDocument();
    });

    it('powinien zaokrąglić 0.999 do 100%', () => {
      render(<MatchScoreBadge matchScore={0.999} />);
      expect(screen.getByText('Dopasowanie: 100%')).toBeInTheDocument();
    });

    it('powinien zaokrąglić 0.001 do 0%', () => {
      render(<MatchScoreBadge matchScore={0.001} />);
      expect(screen.getByText('Dopasowanie: 0%')).toBeInTheDocument();
    });

    it('powinien zaokrąglić 0.005 do 1%', () => {
      render(<MatchScoreBadge matchScore={0.005} />);
      expect(screen.getByText('Dopasowanie: 1%')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // KOLORYSTYKA - REGUŁY BIZNESOWE
  // =============================================================================

  describe('Kolorystyka na podstawie wartości procentowej', () => {
    describe('Wysoki wynik (>= 80%)', () => {
      it('powinien użyć zielonych klas CSS dla 80%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.8} />);
        const badge = container.querySelector('[class*="bg-green-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć zielonych klas CSS dla 85%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.85} />);
        const badge = container.querySelector('[class*="bg-green-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć zielonych klas CSS dla 100%', () => {
        const { container } = render(<MatchScoreBadge matchScore={1.0} />);
        const badge = container.querySelector('[class*="bg-green-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien zawierać wszystkie właściwe klasy kolorystyczne (zielone)', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.9} />);
        const badge = container.querySelector('[class*="bg-green-100"]');
        
        expect(badge?.className).toContain('bg-green-100');
        expect(badge?.className).toContain('text-green-800');
        expect(badge?.className).toContain('border-green-200');
      });
    });

    describe('Średni wynik (50% - 79%)', () => {
      it('powinien użyć żółtych klas CSS dla 50%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.5} />);
        const badge = container.querySelector('[class*="bg-yellow-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć żółtych klas CSS dla 60%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.6} />);
        const badge = container.querySelector('[class*="bg-yellow-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć żółtych klas CSS dla 79%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.79} />);
        const badge = container.querySelector('[class*="bg-yellow-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć żółtych klas CSS dla 79.4% (przed zaokrągleniem)', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.794} />);
        const badge = container.querySelector('[class*="bg-yellow-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien zawierać wszystkie właściwe klasy kolorystyczne (żółte)', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.65} />);
        const badge = container.querySelector('[class*="bg-yellow-100"]');
        
        expect(badge?.className).toContain('bg-yellow-100');
        expect(badge?.className).toContain('text-yellow-800');
        expect(badge?.className).toContain('border-yellow-200');
      });
    });

    describe('Niski wynik (< 50%)', () => {
      it('powinien użyć czerwonych klas CSS dla 0%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0} />);
        const badge = container.querySelector('[class*="bg-red-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć czerwonych klas CSS dla 25%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.25} />);
        const badge = container.querySelector('[class*="bg-red-100"]');
        expect(badge).toBeInTheDocument();
      });

      it('powinien użyć czerwonych klas CSS dla 49%', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.49} />);
        const badge = container.querySelector('[class*="bg-red-100"]');
        expect(badge).toBeInTheDocument();
      });

    it('powinien użyć żółtych klas CSS dla 49.9% (zaokrągla się do 50%)', () => {
      // Math.round(0.499 * 100) = Math.round(49.9) = 50
      const { container } = render(<MatchScoreBadge matchScore={0.499} />);
      const badge = container.querySelector('[class*="bg-yellow-100"]');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('Dopasowanie: 50%')).toBeInTheDocument();
    });

      it('powinien zawierać wszystkie właściwe klasy kolorystyczne (czerwone)', () => {
        const { container } = render(<MatchScoreBadge matchScore={0.3} />);
        const badge = container.querySelector('[class*="bg-red-100"]');
        
        expect(badge?.className).toContain('bg-red-100');
        expect(badge?.className).toContain('text-red-800');
        expect(badge?.className).toContain('border-red-200');
      });
    });
  });

  // =============================================================================
  // WARUNKI BRZEGOWE - PROGI KOLORYSTYCZNE
  // =============================================================================

  describe('Warunki brzegowe dla progów kolorystycznych', () => {
    it('powinien użyć żółtego koloru dokładnie przy 50% (dolna granica średniego)', () => {
      const { container } = render(<MatchScoreBadge matchScore={0.5} />);
      const badge = container.querySelector('[class*="bg-yellow-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć żółtego koloru przy 0.499 (zaokrągla się do 50%)', () => {
      // Math.round(0.499 * 100) = Math.round(49.9) = 50
      const { container } = render(<MatchScoreBadge matchScore={0.499} />);
      const badge = container.querySelector('[class*="bg-yellow-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć czerwonego koloru przy 0.494 (zaokrągla się do 49%)', () => {
      // Math.round(0.494 * 100) = Math.round(49.4) = 49
      const { container } = render(<MatchScoreBadge matchScore={0.494} />);
      const badge = container.querySelector('[class*="bg-red-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć zielonego koloru dokładnie przy 80% (dolna granica wysokiego)', () => {
      const { container } = render(<MatchScoreBadge matchScore={0.8} />);
      const badge = container.querySelector('[class*="bg-green-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć zielonego koloru przy 0.799 (zaokrągla się do 80%)', () => {
      // Math.round(0.799 * 100) = Math.round(79.9) = 80
      const { container } = render(<MatchScoreBadge matchScore={0.799} />);
      const badge = container.querySelector('[class*="bg-green-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć żółtego koloru przy 0.794 (zaokrągla się do 79%)', () => {
      // Math.round(0.794 * 100) = Math.round(79.4) = 79
      const { container } = render(<MatchScoreBadge matchScore={0.794} />);
      const badge = container.querySelector('[class*="bg-yellow-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć żółtego koloru przy 79.4% (zaokrągla do 79%, przed progiem)', () => {
      // 79.4% * 100 = 79.4, Math.round(79.4) = 79
      const { container } = render(<MatchScoreBadge matchScore={0.794} />);
      const badge = container.querySelector('[class*="bg-yellow-100"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien użyć żółtego koloru przy 79.5% (zaokrągla do 80%, ale matchScore to 0.795)', () => {
      // UWAGA: getMatchScoreColor otrzymuje zaokrągloną wartość percentage = 80
      // więc powinien zwrócić ZIELONY kolor
      const { container } = render(<MatchScoreBadge matchScore={0.795} />);
      const badge = container.querySelector('[class*="bg-green-100"]');
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('Dopasowanie: 80%')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // WARTOŚCI SKRAJNE I NIETYPOWE
  // =============================================================================

  describe('Wartości skrajne i nietypowe', () => {
    it('powinien obsłużyć wartość 0', () => {
      render(<MatchScoreBadge matchScore={0} />);
      expect(screen.getByText('Dopasowanie: 0%')).toBeInTheDocument();
    });

    it('powinien obsłużyć bardzo małą wartość (0.001)', () => {
      render(<MatchScoreBadge matchScore={0.001} />);
      expect(screen.getByText('Dopasowanie: 0%')).toBeInTheDocument();
    });

    it('powinien obsłużyć wartość maksymalną (1)', () => {
      render(<MatchScoreBadge matchScore={1} />);
      expect(screen.getByText('Dopasowanie: 100%')).toBeInTheDocument();
    });

    it('powinien obsłużyć wartość bardzo bliską 1 (0.999)', () => {
      render(<MatchScoreBadge matchScore={0.999} />);
      expect(screen.getByText('Dopasowanie: 100%')).toBeInTheDocument();
    });

    it('powinien obsłużyć wartości ujemne (edge case - nieprawidłowe dane)', () => {
      // W praktyce matchScore powinien być >= 0, ale test sprawdza odporność
      render(<MatchScoreBadge matchScore={-0.1} />);
      // Math.round(-0.1 * 100) = -10
      expect(screen.getByText('Dopasowanie: -10%')).toBeInTheDocument();
    });

    it('powinien obsłużyć wartości > 1 (edge case - nieprawidłowe dane)', () => {
      // W praktyce matchScore powinien być <= 1, ale test sprawdza odporność
      render(<MatchScoreBadge matchScore={1.5} />);
      // Math.round(1.5 * 100) = 150
      expect(screen.getByText('Dopasowanie: 150%')).toBeInTheDocument();
    });

    it('powinien obsłużyć wartości dziesiętne z wieloma miejscami po przecinku', () => {
      render(<MatchScoreBadge matchScore={0.6789123456} />);
      // Math.round(0.6789123456 * 100) = 68
      expect(screen.getByText('Dopasowanie: 68%')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // REGRESJA - WERYFIKACJA STABILNOŚCI LOGIKI
  // =============================================================================

  describe('Testy regresji', () => {
    it('powinien zawsze renderować tekst "Dopasowanie:" niezależnie od wartości', () => {
      const testCases = [0, 0.25, 0.5, 0.75, 1];
      
      testCases.forEach((matchScore) => {
        const { unmount } = render(<MatchScoreBadge matchScore={matchScore} />);
        expect(screen.getByText(/Dopasowanie:/i)).toBeInTheDocument();
        unmount();
      });
    });

    it('powinien zawsze zawierać znak % w wyświetlanym tekście', () => {
      const testCases = [0, 0.33, 0.66, 0.99];
      
      testCases.forEach((matchScore) => {
        const { unmount } = render(<MatchScoreBadge matchScore={matchScore} />);
        const badgeText = screen.getByText(/Dopasowanie:/i).textContent;
        expect(badgeText).toContain('%');
        unmount();
      });
    });

    it('powinien poprawnie renderować różne wartości matchScore kolejno', () => {
      const { rerender } = render(<MatchScoreBadge matchScore={0.3} />);
      expect(screen.getByText('Dopasowanie: 30%')).toBeInTheDocument();

      rerender(<MatchScoreBadge matchScore={0.6} />);
      expect(screen.getByText('Dopasowanie: 60%')).toBeInTheDocument();

      rerender(<MatchScoreBadge matchScore={0.9} />);
      expect(screen.getByText('Dopasowanie: 90%')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // INTEGRACJA Z KOMPOENTEM BADGE
  // =============================================================================

  describe('Integracja z komponentem Badge', () => {
    it('powinien przekazać właściwy wariant "outline" do Badge', () => {
      const { container } = render(<MatchScoreBadge matchScore={0.75} />);
      
      // Badge z wariantem outline powinien mieć border
      const badge = container.querySelector('[class*="border"]');
      expect(badge).toBeInTheDocument();
    });

    it('powinien połączyć klasę "border" z klasami kolorowymi', () => {
      const { container } = render(<MatchScoreBadge matchScore={0.85} />);
      const badge = container.querySelector('[class*="border"]');
      
      // Powinna zawierać zarówno "border" jak i kolory
      expect(badge?.className).toContain('border');
      expect(badge?.className).toContain('bg-green-100');
    });
  });
});


/**
 * useScrollVisibility Hook
 * Zarządza widocznością sticky bottom bar na podstawie pozycji scrolla
 */

import { useState, useEffect } from 'react';

/**
 * Hook do zarządzania widocznością elementu na podstawie scrolla
 * @param threshold - Próg scrolla (w pikselach) po którym element staje się widoczny
 * @returns boolean - czy element powinien być widoczny
 */
export function useScrollVisibility(threshold: number = 300): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Throttle scroll handler dla lepszej wydajności
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > threshold;
          setIsVisible(scrolled);
          ticking = false;
        });

        ticking = true;
      }
    };

    // Initial check
    handleScroll();

    // Add listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return isVisible;
}


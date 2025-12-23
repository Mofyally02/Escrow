/**
 * Hook for responsive scroll handling with throttling
 */
import { useEffect, useRef } from 'react';
import { throttle } from '@/lib/utils/responsive';

interface UseResponsiveScrollOptions {
  onScroll?: (scrollY: number) => void;
  throttleMs?: number;
  enabled?: boolean;
}

export function useResponsiveScroll(options: UseResponsiveScrollOptions = {}) {
  const { onScroll, throttleMs = 100, enabled = true } = options;
  const scrollHandlerRef = useRef<((scrollY: number) => void) | null>(null);

  useEffect(() => {
    if (!enabled || !onScroll) return;

    // Create throttled scroll handler
    scrollHandlerRef.current = throttle((scrollY: number) => {
      onScroll(scrollY);
    }, throttleMs);

    const handleScroll = () => {
      if (scrollHandlerRef.current) {
        scrollHandlerRef.current(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, onScroll, throttleMs]);

  return {
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  };
}


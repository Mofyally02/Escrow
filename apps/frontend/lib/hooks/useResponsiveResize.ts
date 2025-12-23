/**
 * Hook for responsive resize handling with throttling
 */
import { useEffect, useState } from 'react';
import { throttle } from '@/lib/utils/responsive';

interface UseResponsiveResizeOptions {
  onResize?: (width: number, height: number) => void;
  throttleMs?: number;
  enabled?: boolean;
}

export function useResponsiveResize(options: UseResponsiveResizeOptions = {}) {
  const { onResize, throttleMs = 150, enabled = true } = options;
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!enabled) return;

    // Create throttled resize handler
    const throttledResize = throttle((width: number, height: number) => {
      setDimensions({ width, height });
      if (onResize) {
        onResize(width, height);
      }
    }, throttleMs);

    const handleResize = () => {
      throttledResize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, onResize, throttleMs]);

  return dimensions;
}


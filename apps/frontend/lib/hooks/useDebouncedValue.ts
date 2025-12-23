/**
 * Hook for debounced values - useful for search inputs
 */
import { useState, useEffect } from 'react';
import { debounce } from '@/lib/utils/responsive';

export function useDebouncedValue<T>(
  value: T,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const debouncedUpdate = debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay);

    debouncedUpdate(value);

    // Cleanup function
    return () => {
      // The debounce function handles cleanup internally
    };
  }, [value, delay]);

  return debouncedValue;
}


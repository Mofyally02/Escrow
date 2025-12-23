/**
 * Hook for managing button states with immediate feedback
 * Ensures buttons are always responsive
 */
import { useState, useCallback, useEffect, useRef } from 'react';

interface UseButtonStateOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  timeout?: number; // Auto-reset timeout
}

export function useButtonState(options: UseButtonStateOptions = {}) {
  const { onSuccess, onError, timeout = 5000 } = options;
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setLoading = useCallback(() => {
    clearTimeout();
    setState('loading');
  }, [clearTimeout]);

  const setSuccess = useCallback(() => {
    clearTimeout();
    setState('success');
    onSuccess?.();

    // Auto-reset after timeout
    timeoutRef.current = setTimeout(() => {
      setState('idle');
    }, timeout);
  }, [onSuccess, timeout, clearTimeout]);

  const setError = useCallback(
    (error?: Error) => {
      clearTimeout();
      setState('error');
      if (error) {
        onError?.(error);
      }

      // Auto-reset after timeout
      timeoutRef.current = setTimeout(() => {
        setState('idle');
      }, timeout);
    },
    [onError, timeout, clearTimeout]
  );

  const reset = useCallback(() => {
    clearTimeout();
    setState('idle');
  }, [clearTimeout]);

  useEffect(() => {
    return () => {
      clearTimeout();
    };
  }, [clearTimeout]);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    setLoading,
    setSuccess,
    setError,
    reset,
  };
}


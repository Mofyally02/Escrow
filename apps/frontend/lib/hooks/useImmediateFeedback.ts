/**
 * Hook for immediate UI feedback before server response
 * Improves perceived performance
 */
import { useState, useCallback, useEffect } from 'react';

interface UseImmediateFeedbackOptions {
  onSuccess?: () => void;
  onError?: () => void;
  resetDelay?: number;
}

export function useImmediateFeedback(options: UseImmediateFeedbackOptions = {}) {
  const { onSuccess, onError, resetDelay = 2000 } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasSuccess, setHasSuccess] = useState(false);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    setHasError(false);
    setHasSuccess(false);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsProcessing(false);
    setHasSuccess(true);
    onSuccess?.();

    // Reset success state after delay
    setTimeout(() => {
      setHasSuccess(false);
    }, resetDelay);
  }, [onSuccess, resetDelay]);

  const handleError = useCallback(() => {
    setIsProcessing(false);
    setHasError(true);
    onError?.();

    // Reset error state after delay
    setTimeout(() => {
      setHasError(false);
    }, resetDelay);
  }, [onError, resetDelay]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setHasError(false);
    setHasSuccess(false);
  }, []);

  return {
    isProcessing,
    hasError,
    hasSuccess,
    startProcessing,
    handleSuccess,
    handleError,
    reset,
  };
}


/**
 * Optimistic mutation hook for instant UI updates
 * Provides immediate feedback before server confirmation
 */
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface OptimisticMutationOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[];
  optimisticUpdate?: (variables: TVariables) => void;
  rollback?: (context: TContext) => void;
}

export function useOptimisticMutation<TData, TVariables, TContext = unknown>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  invalidateQueries = [],
  optimisticUpdate,
  rollback,
}: OptimisticMutationOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const previousData: Array<{ queryKey: string[]; data: unknown }> = [];
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClient.cancelQueries({ queryKey: [queryKey] })
          )
        );

        // Snapshot previous value for rollback
        invalidateQueries.forEach((queryKey) => {
          previousData.push({
            queryKey: [queryKey],
            data: queryClient.getQueryData([queryKey]),
          });
        });
      }

      // Optimistically update UI
      if (optimisticUpdate) {
        optimisticUpdate(variables);
      }

      return { previousData } as TContext;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      if (successMessage) {
        toast.success(successMessage);
      }

      onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (rollback && context) {
        rollback(context);
      } else if (context && 'previousData' in context) {
        // Restore previous data
        (context.previousData as Array<{ queryKey: string[]; data: unknown }>).forEach(
          ({ queryKey, data }) => {
            queryClient.setQueryData(queryKey, data);
          }
        );
      }

      if (errorMessage) {
        toast.error(errorMessage);
      }

      onError?.(error, variables, context);
    },
  });

  return mutation;
}


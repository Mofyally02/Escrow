'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (gcTime replaces cacheTime in React Query v5)
            refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
            refetchOnMount: false, // Use cached data if available
            refetchOnReconnect: true, // Refetch when connection is restored
            retry: 1, // Fast failure for better UX
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
          mutations: {
            retry: 0, // Don't retry mutations - show error immediately
            // Optimistic updates will be handled per mutation
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}


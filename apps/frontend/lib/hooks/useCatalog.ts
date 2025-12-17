'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CatalogListing, ListingDetail, CatalogFilters } from '@/types/catalog';

const PAGE_SIZE = 12;

export function useCatalogList(filters: CatalogFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.catalog(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        skip: (pageParam * PAGE_SIZE).toString(),
        limit: PAGE_SIZE.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await apiClient.get<CatalogListing[]>(
        `/catalog?${params.toString()}`
      );
      
      // Transform to paginated format for infinite query
      const listings = response.data;
      const hasMore = listings.length === PAGE_SIZE;
      
      return {
        listings,
        page: pageParam,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useListingDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ListingDetail>(
        `/catalog/${id}`
      );
      return response.data;
    },
    enabled: !!id && !isNaN(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


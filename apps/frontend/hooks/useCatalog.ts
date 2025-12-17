'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CatalogListing, CatalogListingDetail, CatalogFilters } from '@/types/catalog';

const CATALOG_PAGE_SIZE = 20;

export function useCatalog(filters: CatalogFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.catalog(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.min_price) params.append('min_price', filters.min_price.toString());
      if (filters.max_price) params.append('max_price', filters.max_price.toString());
      if (filters.min_earnings) params.append('min_earnings', filters.min_earnings.toString());
      params.append('skip', (pageParam * CATALOG_PAGE_SIZE).toString());
      params.append('limit', CATALOG_PAGE_SIZE.toString());

      const response = await apiClient.get<CatalogListing[]>(`/catalog?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === CATALOG_PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useListingDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<CatalogListingDetail>(`/catalog/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

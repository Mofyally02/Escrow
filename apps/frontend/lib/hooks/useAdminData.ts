'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  AdminListing,
  AdminTransaction,
  AdminUser,
  ListingActionRequest,
  DisputeResolutionRequest,
} from '@/types/admin';
import { ListingState } from '@/types/listing';

export function useAdminListings(filters?: { state?: ListingState }) {
  return useQuery({
    queryKey: queryKeys.admin.listings(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.state) {
        params.append('state', filters.state);
      }
      // Backend returns List[ListingDetailResponse] directly, not wrapped
      const response = await apiClient.get<AdminListing[]>(
        `/admin/listings?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
}

export function useAdminListing(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.listings({ id }),
    queryFn: async () => {
      // Backend returns ListingDetailResponse directly, not wrapped
      const response = await apiClient.get<AdminListing>(
        `/admin/listings/${id}`
      );
      return response.data;
    },
    enabled: !!id && !isNaN(id),
    staleTime: 30 * 1000,
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: ListingActionRequest;
    }) => {
      // Backend returns ListingResponse directly, not wrapped
      const response = await apiClient.post<AdminListing>(
        `/admin/listings/${id}/approve`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (listing) => {
      // Invalidate all admin listing queries to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.listings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.listings({ id: listing.id }),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      // Also invalidate catalog to show newly approved listings
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      toast.success('Listing approved successfully! It is now visible to buyers.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to approve listing';
      toast.error(message);
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ListingActionRequest;
    }) => {
      // Backend expects 'reason' as a query parameter for POST
      // Backend returns ListingResponse directly, not wrapped
      const response = await apiClient.post<AdminListing>(
        `/admin/listings/${id}/reject?reason=${encodeURIComponent(data.reason || '')}`,
        {}
      );
      return response.data;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.listings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      toast.success('Listing rejected');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to reject listing';
      toast.error(message);
    },
  });
}

export function useRequestMoreInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ListingActionRequest;
    }) => {
      // Backend expects 'message' as a query parameter for POST
      // Backend returns ListingResponse directly, not wrapped
      const response = await apiClient.post<AdminListing>(
        `/admin/listings/${id}/request-info?message=${encodeURIComponent(data.reason || data.notes || '')}`,
        {}
      );
      return response.data;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.listings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      toast.success('Request sent to seller');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to send request';
      toast.error(message);
    },
  });
}

export function useAdminTransactions(filters?: { state?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.transactions(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.state) {
        params.append('state', filters.state);
      }
      // Backend endpoint is /admin/transactions (from admin_transactions router)
      const response = await apiClient.get<{ transactions: AdminTransaction[] }>(
        `/admin/transactions?${params.toString()}`
      );
      return response.data.transactions;
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminTransaction(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.transactions({ id }),
    queryFn: async () => {
      // Backend endpoint is /admin/transactions/{id}
      const response = await apiClient.get<{ transaction: AdminTransaction }>(
        `/admin/transactions/${id}`
      );
      return response.data.transaction;
    },
    enabled: !!id && !isNaN(id),
    staleTime: 30 * 1000,
  });
}

export function useForceRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: DisputeResolutionRequest;
    }) => {
      // Backend expects { reason: string }
      const response = await apiClient.post<{ transaction: AdminTransaction }>(
        `/admin/transactions/${id}/release`,
        { reason: data.reason }
      );
      return response.data.transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.transactions(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transaction.id),
      });
      toast.success('Funds released to seller');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to release funds';
      toast.error(message);
    },
  });
}

export function useForceRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: DisputeResolutionRequest;
    }) => {
      // Backend expects { reason: string }
      const response = await apiClient.post<{ transaction: AdminTransaction }>(
        `/admin/transactions/${id}/refund`,
        { reason: data.reason }
      );
      return response.data.transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.transactions(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transaction.id),
      });
      toast.success('Funds refunded to buyer');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to refund funds';
      toast.error(message);
    },
  });
}

// useAdminUsers has been moved to useAdminUsers.ts
// This export is kept for backward compatibility but will be removed
export { useAdminUsers } from './useAdminUsers';

export function useAdminAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      // Backend may not have analytics endpoint yet
      // Return mock data for now
      const mockData = {
        total_listings: 0,
        pending_listings: 0,
        approved_listings: 0,
        total_transactions: 0,
        active_escrows: 0,
        total_revenue: 0,
        dispute_rate: 0,
        average_transaction_value: 0,
      };

      try {
        const response = await apiClient.get<{ analytics: any }>(
          '/admin/analytics'
        );
        return response.data.analytics || mockData;
      } catch (error) {
        // Endpoint may not exist yet, return mock data
        return mockData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

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
      const response = await apiClient.get<{ listings: AdminListing[] }>(
        `/admin/listings?${params.toString()}`
      );
      return response.data.listings;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAdminListing(id: number) {
  return useQuery({
    queryKey: queryKeys.admin.listings({ id }),
    queryFn: async () => {
      const response = await apiClient.get<{ listing: AdminListing }>(
        `/admin/listings/${id}`
      );
      return response.data.listing;
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
      const response = await apiClient.post<{ listing: AdminListing }>(
        `/admin/listings/${id}/approve`,
        data || {}
      );
      return response.data.listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.listings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      toast.success('Listing approved successfully!');
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
      const response = await apiClient.post<{ listing: AdminListing }>(
        `/admin/listings/${id}/reject?reason=${encodeURIComponent(data.reason || '')}`,
        {}
      );
      return response.data.listing;
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
      const response = await apiClient.post<{ listing: AdminListing }>(
        `/admin/listings/${id}/request-info?message=${encodeURIComponent(data.reason || data.notes || '')}`,
        {}
      );
      return response.data.listing;
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

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async () => {
      // Backend may not have users endpoint yet
      // Return empty array for now
      try {
        const response = await apiClient.get<{ users: AdminUser[] }>(
          '/admin/users'
        );
        return response.data.users;
      } catch (error) {
        // Endpoint may not exist yet, return empty array
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

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

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  Listing,
  ListingCreate,
  ListingUpdate,
  ProofFileCreate,
} from '@/types/listing';

export function useSellerListings() {
  return useQuery({
    queryKey: queryKeys.listings.bySeller(0), // Seller listings endpoint
    queryFn: async () => {
      const response = await apiClient.get<{ listings: Listing[] }>(
        '/listings'
      );
      return response.data.listings;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSellerListing(id: number) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ listing: Listing }>(
        `/listings/${id}`
      );
      return response.data.listing;
    },
    enabled: !!id && !isNaN(id),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ListingCreate) => {
      const response = await apiClient.post<{ listing: Listing }>(
        '/listings',
        data
      );
      return response.data.listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.bySeller(0),
      });
      toast.success('Listing created successfully!');
      router.push(`/seller/listings/${listing.id}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to create listing';
      toast.error(message);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ListingUpdate;
    }) => {
      const response = await apiClient.patch<{ listing: Listing }>(
        `/listings/${id}`,
        data
      );
      return response.data.listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success('Listing updated successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to update listing';
      toast.error(message);
    },
  });
}

export function useSubmitListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post<{ listing: Listing }>(
        `/listings/${id}/submit`
      );
      return response.data.listing;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success('Listing submitted for review!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to submit listing';
      toast.error(message);
    },
  });
}

export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      proofData,
    }: {
      listingId: number;
      proofData: ProofFileCreate;
    }) => {
      const formData = new FormData();
      formData.append('proof_type', proofData.proof_type);
      formData.append('file', proofData.file);
      if (proofData.description) {
        formData.append('description', proofData.description);
      }

      const response = await apiClient.post<{ proof: any }>(
        `/listings/${listingId}/proofs`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.proof;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(variables.listingId),
      });
      toast.success('Proof file uploaded successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to upload proof file';
      toast.error(message);
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/listings/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.bySeller(0),
      });
      toast.success('Listing deleted successfully!');
      router.push('/seller/listings');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to delete listing';
      toast.error(message);
    },
  });
}


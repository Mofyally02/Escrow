'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { extractErrorMessage } from '@/lib/utils/error-handler';
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
      const response = await apiClient.get<Listing[]>(
        '/listings'
      );
      // Backend returns array directly, not wrapped in object
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSellerListing(id: number | string | null) {
  // Ensure id is a valid number
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  return useQuery({
    queryKey: queryKeys.listings.detail(numericId || 0),
    queryFn: async () => {
      // Ensure we're passing a number, not a string
      if (!numericId || isNaN(numericId)) {
        throw new Error('Invalid listing ID');
      }
      const response = await apiClient.get<Listing>(
        `/listings/${numericId}`
      );
      // Backend returns Listing directly
      return response.data;
    },
    enabled: !!numericId && !isNaN(numericId) && numericId > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: ListingCreate) => {
      const response = await apiClient.post<Listing>(
        '/listings',
        data
      );
      // Backend returns Listing directly
      return response.data;
    },
    // Optimistic update for instant UI feedback
    onMutate: async (newListing) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.bySeller(0) });
      
      // Snapshot previous value
      const previousListings = queryClient.getQueryData<Listing[]>(
        queryKeys.listings.bySeller(0)
      );
      
      // Optimistically update
      if (previousListings) {
        const optimisticListing: Listing = {
          id: Date.now(), // Temporary ID
          ...newListing,
          state: 'draft' as any,
          seller_id: 0,
          created_at: new Date().toISOString(),
          updated_at: null,
        };
        queryClient.setQueryData<Listing[]>(
          queryKeys.listings.bySeller(0),
          [...previousListings, optimisticListing]
        );
      }
      
      return { previousListings };
    },
    onSuccess: (listing) => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.bySeller(0),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all() });
      toast.success('Listing created successfully!');
      router.push(`/seller/listings/${listing.id}`);
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousListings) {
        queryClient.setQueryData(
          queryKeys.listings.bySeller(0),
          context.previousListings
        );
      }
      const message = extractErrorMessage(error) || 'Failed to create listing';
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
      const response = await apiClient.patch<Listing>(
        `/listings/${id}`,
        data
      );
      // Backend returns Listing directly
      return response.data;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      // Invalidate catalog if listing is approved
      if (listing.state === 'approved') {
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all() });
      }
      toast.success('Listing updated successfully!');
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error) || 'Failed to update listing';
      toast.error(message);
    },
  });
}

export function useSubmitListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post<Listing>(
        `/listings/${id}/submit`
      );
      // Backend returns Listing directly
      return response.data;
    },
    onSuccess: (listing) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(listing.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      // Invalidate catalog queries (will show when approved)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all() });
      toast.success('Listing submitted for review!');
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error) || 'Failed to submit listing';
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
      listingId: number | string;
      proofData: ProofFileCreate;
    }) => {
      // Ensure listingId is a number
      const id = typeof listingId === 'string' ? parseInt(listingId, 10) : Number(listingId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid listing ID');
      }
      
      const formData = new FormData();
      formData.append('proof_type', proofData.proof_type);
      formData.append('file', proofData.file);
      if (proofData.description) {
        formData.append('description', proofData.description);
      }

      const response = await apiClient.post<{ proof: any }>(
        `/listings/${id}/proofs`,
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
      // Ensure we use a number for the query key
      const id = typeof variables.listingId === 'string' 
        ? parseInt(variables.listingId, 10) 
        : Number(variables.listingId);
      if (!isNaN(id) && id > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.listings.detail(id),
        });
      }
      toast.success('Proof file uploaded successfully!');
    },
    onError: (error: any) => {
      const message = extractErrorMessage(error) || 'Failed to upload proof file';
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
      const message = extractErrorMessage(error) || 'Failed to delete listing';
      toast.error(message);
    },
  });
}


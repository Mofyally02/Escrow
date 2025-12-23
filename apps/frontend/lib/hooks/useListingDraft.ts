'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { extractErrorMessage } from '@/lib/utils/error-handler';

export interface DraftData {
  accountDetails?: any;
  credentials?: any;
  proofs: any[];
  sellerAgreementAcknowledged: boolean;
}

export interface DraftResponse {
  id: number;
  seller_id: number;
  data: DraftData;
  step: number;
  status: string;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

const DRAFT_KEY = 'listing_draft';
const DRAFT_TIMESTAMP_KEY = 'listing_draft_timestamp';
const DRAFT_STEP_KEY = 'listing_draft_step';

/**
 * Get draft from backend
 */
export function useDraft() {
  return useQuery({
    queryKey: ['listing_draft'],
    queryFn: async () => {
      const response = await apiClient.get<DraftResponse>('/listings/draft');
      return response.data;
    },
    staleTime: 0, // Always fetch fresh on mount
    retry: 1,
  });
}

/**
 * Save draft to backend (debounced)
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ data, step }: { data: DraftData; step: number }) => {
      const response = await apiClient.put<DraftResponse>('/listings/draft', {
        data,
        step,
      });
      return response.data;
    },
    onSuccess: (draft) => {
      // Update query cache
      queryClient.setQueryData(['listing_draft'], draft);
      
      // Update sessionStorage timestamp
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(DRAFT_TIMESTAMP_KEY, draft.last_saved_at);
      }
    },
    onError: (error: any) => {
      console.error('Failed to save draft:', error);
      // Don't show toast for auto-save errors to avoid spam
    },
  });
}

/**
 * Submit draft as final listing
 */
export function useSubmitDraft() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // POST request with no body - endpoint uses draft data from database
      const response = await apiClient.post('/listings/draft/submit', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.data;
    },
    onSuccess: () => {
      // Clear draft from cache
      queryClient.setQueryData(['listing_draft'], null);
      
      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        sessionStorage.removeItem(DRAFT_STEP_KEY);
      }
      
      toast.success('Listing submitted successfully!');
    },
    onError: (error: any) => {
      // Skip logging 401 errors - they're handled by the interceptor
      if (error?.response?.status !== 401 && process.env.NODE_ENV === 'development') {
        console.error('Draft submission error:', {
          message: error?.message,
          status: error?.response?.status,
          detail: error?.response?.data?.detail,
        });
      }
      
      // Safely extract error message (handles FastAPI validation errors)
      const message = extractErrorMessage(error) || 'Failed to submit listing. Please check your connection and try again.';
      toast.error(message);
    },
  });
}

/**
 * Delete draft
 */
export function useDeleteDraft() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/listings/draft');
    },
    onSuccess: () => {
      queryClient.setQueryData(['listing_draft'], null);
      
      // Clear sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        sessionStorage.removeItem(DRAFT_STEP_KEY);
      }
      
      toast.success('Draft discarded');
    },
    onError: (error: any) => {
      // Safely extract error message (handles FastAPI validation errors)
      const message = extractErrorMessage(error) || 'Failed to delete draft';
      toast.error(message);
    },
  });
}

/**
 * Hook for auto-saving draft with debouncing
 */
export function useAutoSaveDraft() {
  const saveDraft = useSaveDraft();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<string>('');
  
  const autoSave = useCallback((data: DraftData, step: number) => {
    // Serialize data for comparison
    const dataString = JSON.stringify({ data, step });
    
    // Skip if unchanged
    if (dataString === lastSavedData.current) {
      return;
    }
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Save to sessionStorage immediately (for instant restore)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      sessionStorage.setItem(DRAFT_STEP_KEY, step.toString());
    }
    
    // Debounce backend save (500ms)
    debounceTimer.current = setTimeout(() => {
      saveDraft.mutate({ data, step });
      lastSavedData.current = dataString;
    }, 500);
  }, [saveDraft]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  
  return autoSave;
}

/**
 * Restore draft from sessionStorage or backend
 */
export function useRestoreDraft() {
  const { data: backendDraft, isLoading } = useDraft();
  
  const restore = useCallback((): { data: DraftData; step: number } | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Get local draft
    const localDraftStr = sessionStorage.getItem(DRAFT_KEY);
    const localTimestamp = sessionStorage.getItem(DRAFT_TIMESTAMP_KEY);
    
    // If we have backend draft, compare timestamps
    if (backendDraft && localDraftStr) {
      const backendTime = new Date(backendDraft.last_saved_at).getTime();
      const localTime = localTimestamp ? new Date(localTimestamp).getTime() : 0;
      
      // Use newer version
      if (backendTime > localTime) {
        return {
          data: backendDraft.data,
          step: backendDraft.step,
        };
      } else {
        try {
          const localData = JSON.parse(localDraftStr);
          // Get step from sessionStorage if available
          const localStep = typeof window !== 'undefined' 
            ? parseInt(sessionStorage.getItem(DRAFT_STEP_KEY) || '0', 10)
            : 0;
          return {
            data: localData,
            step: localStep,
          };
        } catch (e) {
          // Fallback to backend
          return {
            data: backendDraft.data,
            step: backendDraft.step,
          };
        }
      }
    }
    
    // If only backend draft exists
    if (backendDraft) {
      return {
        data: backendDraft.data,
        step: backendDraft.step,
      };
    }
    
    // If only local draft exists
    if (localDraftStr) {
      try {
        const localData = JSON.parse(localDraftStr);
        // Get step from sessionStorage if available
        const localStep = typeof window !== 'undefined' 
          ? parseInt(sessionStorage.getItem(DRAFT_STEP_KEY) || '0', 10)
          : 0;
        return {
          data: localData,
          step: localStep,
        };
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return null;
  }, [backendDraft]);
  
  return { restore, isLoading };
}


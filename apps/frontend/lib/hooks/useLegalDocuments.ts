/**
 * React Query hooks for legal documents
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  LegalDocument,
  LegalDocumentPublic,
  LegalDocumentList,
  LegalDocumentCreate,
  LegalDocumentUpdate,
  LegalDocumentPublishRequest,
  UserAcknowledgmentRequest,
  UserAcknowledgmentResponse,
  AcknowledgmentStatus,
  DocumentType,
} from '@/types/legal';

// Admin endpoints
export function useLegalDocuments(filters?: { document_type?: DocumentType; current_only?: boolean }) {
  return useQuery({
    queryKey: queryKeys.legal.documents(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.document_type) params.append('document_type', filters.document_type);
      if (filters?.current_only) params.append('current_only', 'true');
      
      const response = await apiClient.get<LegalDocument[]>(
        `/admin/legal?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useLegalDocument(id: number) {
  return useQuery({
    queryKey: queryKeys.legal.document(id),
    queryFn: async () => {
      const response = await apiClient.get<LegalDocument>(`/admin/legal/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateLegalDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LegalDocumentCreate) => {
      const response = await apiClient.post<LegalDocument>('/admin/legal', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.all });
    },
  });
}

export function useUpdateLegalDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LegalDocumentUpdate }) => {
      const response = await apiClient.patch<LegalDocument>(`/admin/legal/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.document(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.all });
    },
  });
}

export function usePublishLegalDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: LegalDocumentPublishRequest }) => {
      const response = await apiClient.post<LegalDocument>(
        `/admin/legal/${id}/publish`,
        data || {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.public.all });
    },
  });
}

export function useDeleteLegalDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/legal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.all });
    },
  });
}

// Public endpoints
export function useCurrentLegalDocuments() {
  return useQuery({
    queryKey: queryKeys.legal.public.all,
    queryFn: async () => {
      const response = await apiClient.get<LegalDocumentList[]>('/legal');
      return response.data;
    },
  });
}

export function useLegalDocumentBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.legal.public.slug(slug),
    queryFn: async () => {
      const response = await apiClient.get<LegalDocumentPublic>(`/legal/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useCurrentDocumentByType(documentType: DocumentType) {
  return useQuery({
    queryKey: queryKeys.legal.public.type(documentType),
    queryFn: async () => {
      const response = await apiClient.get<LegalDocumentPublic>(`/legal/${documentType}/current`);
      return response.data;
    },
    enabled: !!documentType,
  });
}

// User acknowledgment endpoints
export function useAcknowledgeDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserAcknowledgmentRequest) => {
      const response = await apiClient.post<UserAcknowledgmentResponse>(
        '/acknowledgments/acknowledge',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.acknowledgments });
    },
  });
}

export function useAcknowledgmentStatus(documentType: DocumentType) {
  return useQuery({
    queryKey: queryKeys.legal['acknowledgments.status'](documentType),
    queryFn: async () => {
      const response = await apiClient.get<AcknowledgmentStatus>(
        `/acknowledgments/check/${documentType}`
      );
      return response.data;
    },
    enabled: !!documentType,
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (authentication errors)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}


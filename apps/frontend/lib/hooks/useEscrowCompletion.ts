'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export interface CredentialRevealResponse {
  username: string;
  password: string;
  recovery_email?: string | null;
  two_fa_secret?: string | null;
  revealed_at: string;
  warning?: string;
  self_destruct_minutes?: number;
}

export function useRevealCredentials() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      userPassword,
    }: {
      transactionId: number;
      userPassword: string;
    }) => {
      const response = await apiClient.post<CredentialRevealResponse>(
        `/transactions/${transactionId}/reveal`,
        { user_password: userPassword }
      );
      return response.data;
    },
    onSuccess: (credentials, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      toast.success('Credentials revealed successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to reveal credentials';
      toast.error(message);
    },
  });
}

export function useConfirmAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiClient.post<{
        transaction: any;
        message: string;
      }>(`/transactions/${transactionId}/confirm-access`, {
        confirmed: true,
      });
      return response.data;
    },
    onSuccess: (data, transactionId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transactionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.myPurchases,
      });
      toast.success(data.message || 'Access confirmed! Funds released to seller.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to confirm access';
      toast.error(message);
    },
  });
}


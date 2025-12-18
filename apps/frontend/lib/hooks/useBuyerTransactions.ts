'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/useAuth';
import type {
  Transaction,
  TransactionDetail,
  TransactionCreate,
  ContractSignRequest,
} from '@/types/transaction';

export function useBuyerTransactions() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.transactions.myPurchases,
    queryFn: async () => {
      const response = await apiClient.get<Transaction[]>(
        '/transactions'
      );
      // Backend returns array directly, not wrapped in object
      return response.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    // Only fetch if user is authenticated
    enabled: isAuthenticated,
  });
}

export function useTransactionDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<TransactionDetail>(
        `/transactions/${id}`
      );
      // Backend returns TransactionDetailResponse directly
      return response.data;
    },
    enabled: !!id && !isNaN(id),
    staleTime: 30 * 1000, // 30 seconds (poll for updates)
    refetchInterval: 10000, // Poll every 10 seconds for webhook updates
  });
}

export function useInitiatePurchase() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: TransactionCreate) => {
      // Backend creates transaction and initializes payment in one call
      const response = await apiClient.post<{ transaction: TransactionDetail }>(
        '/transactions',
        data
      );
      return response.data.transaction;
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.myPurchases });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      toast.success('Purchase initiated! Proceeding to payment...');
      // Redirect to transaction detail page where payment button will be shown
      router.push(`/buyer/purchases/${transaction.id}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to initiate purchase';
      toast.error(message);
    },
  });
}

export function useSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: number;
      data: ContractSignRequest;
    }) => {
      // Backend expects { full_name: string } for contract signing
      const response = await apiClient.post<{ contract: any }>(
        `/contracts/${transactionId}/sign`,
        { full_name: data.signed_by_name }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      toast.success('Contract signed successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to sign contract';
      toast.error(message);
    },
  });
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
      const response = await apiClient.post<{
        username: string;
        password: string;
        recovery_email: string | null;
        two_fa_secret: string | null;
        revealed_at: string;
      }>(`/transactions/${transactionId}/reveal`, {
        user_password: userPassword,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      toast.success('Credentials revealed! Please save them securely.');
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
      const response = await apiClient.post<{ transaction: TransactionDetail }>(
        `/transactions/${transactionId}/confirm-access`
      );
      return response.data.transaction;
    },
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(transactionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      toast.success('Access confirmed! Payment released to seller.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to confirm access';
      toast.error(message);
    },
  });
}


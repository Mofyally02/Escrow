'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

/**
 * Buyer Purchase Flow Hooks
 * These hooks implement the step-locked purchase flow as specified in the requirements.
 */

export interface PurchaseInitiateRequest {
  listing_id: number;
}

export interface TransactionStepResponse {
  transaction_id: number;
  current_step: number;
  current_state: string;
  can_proceed: boolean;
  next_step_available: boolean;
  step_requirements_met: Record<string, any>;
  verification_deadline: string | null;
  time_remaining_hours: number | null;
  payment_authorization_url?: string | null;
  paystack_reference?: string | null;
}

export interface PaymentConfirmRequest {
  paystack_reference: string;
  paystack_authorization_code?: string;
}

export interface OwnershipAgreementSignRequest {
  buyer_full_name: string;
  verified_account: boolean;
  accepts_ownership: boolean;
  accepts_risks: boolean;
  platform_liability_ends: boolean;
}

export interface FundsReleaseRequest {
  confirm_ownership: boolean;
}

/**
 * STEP 1: Initiate Purchase
 * - Buyer clicks "Buy Now"
 * - Creates transaction and locks listing
 * - Initializes Paystack payment
 */
export function useInitiateBuyerPurchase() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: PurchaseInitiateRequest) => {
      const response = await apiClient.post<TransactionStepResponse>(
        '/purchase/initiate',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.myPurchases });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      // Redirect will be handled by the component
      return data;
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to initiate purchase';
      toast.error(message);
    },
  });
}

/**
 * STEP 2: Confirm Payment
 * - After Paystack payment succeeds
 * - Updates transaction to FUNDS_HELD
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: number;
      data: PaymentConfirmRequest;
    }) => {
      const response = await apiClient.post<TransactionStepResponse>(
        `/purchase/${transactionId}/payment/confirm`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      toast.success('Payment confirmed! Funds held in escrow.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to confirm payment';
      toast.error(message);
    },
  });
}

/**
 * STEP 5: Sign Ownership Agreement
 * - Buyer signs digital contract
 * - Must match full name exactly
 */
export function useSignOwnershipAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: number;
      data: OwnershipAgreementSignRequest;
    }) => {
      const response = await apiClient.post<TransactionStepResponse>(
        `/purchase/${transactionId}/ownership-agreement/sign`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      toast.success('Ownership agreement signed! Legally binding.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to sign ownership agreement';
      toast.error(message);
    },
  });
}

/**
 * STEP 6: Release Funds
 * - Buyer confirms access and releases funds
 * - Final irreversible step
 */
export function useReleaseFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: number;
      data: FundsReleaseRequest;
    }) => {
      const response = await apiClient.post<TransactionStepResponse>(
        `/purchase/${transactionId}/funds/release`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.transactionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      toast.success('Funds released! Transaction completed.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to release funds';
      toast.error(message);
    },
  });
}


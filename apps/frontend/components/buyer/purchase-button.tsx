'use client';

import { LoadingButton } from '@/components/ui/loading-button';
import { useButtonState } from '@/lib/hooks/useButtonState';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PurchaseButtonProps {
  listingId: number;
  price: number;
  className?: string;
}

export function PurchaseButton({ listingId, price, className }: PurchaseButtonProps) {
  const router = useRouter();
  const buttonState = useButtonState({
    onSuccess: () => {
      toast.success('Purchase initiated! Redirecting to payment...');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to initiate purchase');
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/buyer/purchase/initiate`, {
        listing_id: listingId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      buttonState.setSuccess();
      // Redirect to payment or transaction page
      if (data?.transaction_id) {
        router.push(`/buyer/purchases/${data.transaction_id}`);
      }
    },
    onError: (error: any) => {
      buttonState.setError(error);
    },
  });

  const handlePurchase = () => {
    buttonState.setLoading();
    purchaseMutation.mutate();
  };

  return (
    <LoadingButton
      isLoading={buttonState.isLoading || purchaseMutation.isPending}
      loadingText="Processing..."
      onClick={handlePurchase}
      className={className}
      size="lg"
    >
      {buttonState.isSuccess ? 'Processing...' : `Purchase for $${(price / 100).toFixed(2)}`}
    </LoadingButton>
  );
}


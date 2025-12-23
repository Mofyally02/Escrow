'use client';

import { LoadingButton } from '@/components/ui/loading-button';
import { useButtonState } from '@/lib/hooks/useButtonState';
import { useSubmitDraft } from '@/lib/hooks/useListingDraft';
import { useRouter } from 'next/navigation';

interface ListingSubmitButtonProps {
  onSuccess?: (listingId: number) => void;
  className?: string;
}

export function ListingSubmitButton({ onSuccess, className }: ListingSubmitButtonProps) {
  const router = useRouter();
  const submitDraft = useSubmitDraft();
  const buttonState = useButtonState({
    onSuccess: () => {
      // Success handled by submitDraft.onSuccess
    },
    onError: (error) => {
      // Error handled by submitDraft.onError
    },
    timeout: 5000,
  });

  const handleSubmit = async () => {
    buttonState.setLoading();
    try {
      const listing = await submitDraft.mutateAsync(undefined);
      buttonState.setSuccess();
      
      if (listing?.id) {
        const listingId = typeof listing.id === 'string' 
          ? parseInt(listing.id, 10) 
          : listing.id;
        
        if (!isNaN(listingId)) {
          onSuccess?.(listingId);
          // Redirect handled by submitDraft.onSuccess
        }
      }
    } catch (error: any) {
      buttonState.setError(error);
    }
  };

  const isLoading = buttonState.isLoading || submitDraft.isPending;

  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Submitting for Review..."
      onClick={handleSubmit}
      className={className}
      size="lg"
    >
      {buttonState.isSuccess ? 'Submitted!' : 'Submit for Review'}
    </LoadingButton>
  );
}


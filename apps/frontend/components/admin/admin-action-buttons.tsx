'use client';

import { useApproveListing, useRejectListing, useRequestMoreInfo } from '@/lib/hooks/useAdminData';
import { LoadingButton } from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';
import { useButtonState } from '@/lib/hooks/useButtonState';
import { toast } from 'sonner';
import { useState } from 'react';

interface AdminActionButtonsProps {
  listingId: number;
  currentState: string;
}

export function AdminActionButtons({ listingId, currentState }: AdminActionButtonsProps) {
  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();
  const requestInfoMutation = useRequestMoreInfo();

  const approveState = useButtonState({
    onSuccess: () => toast.success('Listing approved successfully!'),
    onError: (error) => toast.error(error.message || 'Failed to approve listing'),
  });

  const rejectState = useButtonState({
    onSuccess: () => toast.success('Listing rejected'),
    onError: (error) => toast.error(error.message || 'Failed to reject listing'),
  });

  const requestInfoState = useButtonState({
    onSuccess: () => toast.success('Request sent to seller'),
    onError: (error) => toast.error(error.message || 'Failed to send request'),
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    approveState.setLoading();
    try {
      await approveMutation.mutateAsync({ id: listingId });
      approveState.setSuccess();
    } catch (error: any) {
      approveState.setError(error);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectState.setLoading();
    try {
      await rejectMutation.mutateAsync({
        id: listingId,
        data: { reason: rejectionReason },
      });
      rejectState.setSuccess();
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error: any) {
      rejectState.setError(error);
    }
  };

  const handleRequestInfo = async () => {
    requestInfoState.setLoading();
    try {
      await requestInfoMutation.mutateAsync({
        id: listingId,
        data: { reason: 'Please provide more information about this listing' },
      });
      requestInfoState.setSuccess();
    } catch (error: any) {
      requestInfoState.setError(error);
    }
  };

  if (currentState !== 'under_review') {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <LoadingButton
        isLoading={approveState.isLoading}
        loadingText="Approving..."
        onClick={handleApprove}
        variant="default"
        className="flex-1"
      >
        {approveState.isSuccess ? 'Approved!' : 'Approve Listing'}
      </LoadingButton>

      <LoadingButton
        isLoading={requestInfoState.isLoading}
        loadingText="Sending..."
        onClick={handleRequestInfo}
        variant="outline"
        className="flex-1"
      >
        {requestInfoState.isSuccess ? 'Sent!' : 'Request More Info'}
      </LoadingButton>

      {showRejectDialog ? (
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Rejection reason..."
            className="px-3 py-2 border rounded-md text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <LoadingButton
              isLoading={rejectState.isLoading}
              loadingText="Rejecting..."
              onClick={handleReject}
              variant="destructive"
              className="flex-1"
            >
              Confirm Reject
            </LoadingButton>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <LoadingButton
          isLoading={rejectState.isLoading}
          loadingText="Rejecting..."
          onClick={() => setShowRejectDialog(true)}
          variant="destructive"
          className="flex-1"
        >
          Reject Listing
        </LoadingButton>
      )}
    </div>
  );
}

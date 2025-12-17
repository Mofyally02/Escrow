'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import {
  useApproveListing,
  useRejectListing,
  useRequestMoreInfo,
} from '@/lib/hooks/useAdminData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AdminActionButtonsProps {
  listingId: number;
  currentState: string;
}

export function AdminActionButtons({
  listingId,
  currentState,
}: AdminActionButtonsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();
  const requestMoreInfo = useRequestMoreInfo();

  const canApprove = currentState === 'under_review';
  const canReject = currentState === 'under_review';
  const canRequestInfo = currentState === 'under_review';

  const handleApprove = () => {
    approveListing.mutate({ id: listingId });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      return;
    }
    rejectListing.mutate(
      {
        id: listingId,
        data: { reason: rejectReason },
      },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          setRejectReason('');
        },
      }
    );
  };

  const handleRequestInfo = () => {
    if (!requestMessage.trim()) {
      return;
    }
    requestMoreInfo.mutate(
      {
        id: listingId,
        data: { reason: requestMessage },
      },
      {
        onSuccess: () => {
          setShowRequestDialog(false);
          setRequestMessage('');
        },
      }
    );
  };

  return (
    <>
      <div className="flex gap-3">
        {canApprove && (
          <Button
            onClick={handleApprove}
            disabled={approveListing.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveListing.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        )}

        {canReject && (
          <Button
            variant="destructive"
            onClick={() => setShowRejectDialog(true)}
            disabled={rejectListing.isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        )}

        {canRequestInfo && (
          <Button
            variant="outline"
            onClick={() => setShowRequestDialog(true)}
            disabled={requestMoreInfo.isPending}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Info
          </Button>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be visible to the seller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this listing is being rejected..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectListing.isPending}
            >
              {rejectListing.isPending ? 'Rejecting...' : 'Reject Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>
              Send a message to the seller requesting additional information or
              proof.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="request-message">Message *</Label>
              <Textarea
                id="request-message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="What additional information do you need?"
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                setRequestMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestInfo}
              disabled={!requestMessage.trim() || requestMoreInfo.isPending}
            >
              {requestMoreInfo.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

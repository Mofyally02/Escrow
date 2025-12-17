'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
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
import { useForceRelease, useForceRefund } from '@/lib/hooks/useAdminData';

interface DisputeResolutionDialogProps {
  transactionId: number;
  action: 'release' | 'refund';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisputeResolutionDialog({
  transactionId,
  action,
  open,
  onOpenChange,
}: DisputeResolutionDialogProps) {
  const [reason, setReason] = useState('');
  const forceRelease = useForceRelease();
  const forceRefund = useForceRefund();

  const isRelease = action === 'release';
  const mutation = isRelease ? forceRelease : forceRefund;

  const handleConfirm = () => {
    if (!reason.trim() || reason.length < 10) {
      return;
    }

    mutation.mutate(
      {
        id: transactionId,
        data: { action, reason },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isRelease ? 'Force Release Funds' : 'Force Refund'}
          </DialogTitle>
          <DialogDescription>
            {isRelease
              ? 'Release funds to seller. This action cannot be undone and will be logged for audit.'
              : 'Refund funds to buyer. This action cannot be undone and will be logged for audit.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Super Admin Override</p>
                <p>
                  This action bypasses normal escrow flow. Only use in dispute
                  resolution scenarios.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="dispute-reason">
              Reason for {isRelease ? 'Release' : 'Refund'} *
            </Label>
            <Textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Explain why you are ${isRelease ? 'releasing' : 'refunding'} funds...`}
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 characters. This will be logged in the audit trail.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || reason.length < 10 || mutation.isPending}
            variant={isRelease ? 'default' : 'destructive'}
          >
            {mutation.isPending
              ? `${isRelease ? 'Releasing' : 'Refunding'}...`
              : `Confirm ${isRelease ? 'Release' : 'Refund'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

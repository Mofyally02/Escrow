'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useConfirmAccess } from '@/lib/hooks/useEscrowCompletion';

interface ConfirmAccessDialogProps {
  transactionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ConfirmAccessDialog({
  transactionId,
  open,
  onOpenChange,
  onSuccess,
}: ConfirmAccessDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [doubleConfirmed, setDoubleConfirmed] = useState(false);
  const confirmMutation = useConfirmAccess();

  const handleConfirm = async () => {
    if (!doubleConfirmed) {
      return;
    }

    try {
      await confirmMutation.mutateAsync(transactionId);
      onSuccess?.();
      onOpenChange(false);
      // Reset state
      setConfirmed(false);
      setDoubleConfirmed(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Confirm Successful Access
          </DialogTitle>
          <DialogDescription>
            This action will release funds to the seller and complete the
            transaction. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* First Confirmation */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="confirm-access"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label
                htmlFor="confirm-access"
                className="text-sm leading-relaxed cursor-pointer"
              >
                I have successfully logged into the account and verified that I
                have full control.
              </Label>
            </div>
          </div>

          {/* Second Confirmation (only shown after first) */}
          {confirmed && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Checkbox
                  id="double-confirm"
                  checked={doubleConfirmed}
                  onCheckedChange={(checked) =>
                    setDoubleConfirmed(checked === true)
                  }
                />
                <Label
                  htmlFor="double-confirm"
                  className="text-sm leading-relaxed cursor-pointer text-yellow-900"
                >
                  I understand this action is irreversible and will release
                  funds to the seller immediately.
                </Label>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Final Warning</p>
              <p>
                Once you confirm, the seller will be paid and the transaction
                will be marked as complete. Make absolutely sure you have access
                to the account before proceeding.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmed(false);
              setDoubleConfirmed(false);
            }}
            disabled={confirmMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!doubleConfirmed || confirmMutation.isPending}
            variant="destructive"
            className="bg-green-600 hover:bg-green-700"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Yes, Release Funds to Seller
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


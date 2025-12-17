'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useConfirmAccess } from '@/lib/hooks/useBuyerTransactions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AccessConfirmationDialogProps {
  transactionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccessConfirmationDialog({
  transactionId,
  open,
  onOpenChange,
}: AccessConfirmationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const confirmAccess = useConfirmAccess();

  const handleConfirm = () => {
    if (!confirmed) {
      return;
    }

    confirmAccess.mutate(transactionId, {
      onSuccess: () => {
        onOpenChange(false);
        setConfirmed(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Confirm Account Access
          </DialogTitle>
          <DialogDescription>
            This action will release payment to the seller. Only confirm if you
            have successfully logged into the account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>This action cannot be undone</li>
                  <li>Payment will be immediately released to the seller</li>
                  <li>Only confirm if you have full access to the account</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm-access"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <label
              htmlFor="confirm-access"
              className="text-sm text-foreground cursor-pointer"
            >
              I confirm that I have successfully logged into the account and
              have full access. I understand that this will release payment to
              the seller.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmed || confirmAccess.isPending}
            className="bg-primary"
          >
            {confirmAccess.isPending ? (
              'Confirming...'
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Access & Release Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useReleaseFunds } from '@/lib/hooks/useBuyerPurchaseFlow';
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
  onConfirmSuccess?: () => void;
}

export function AccessConfirmationDialog({
  transactionId,
  open,
  onOpenChange,
  onConfirmSuccess,
}: AccessConfirmationDialogProps) {
  const [checkboxes, setCheckboxes] = useState({
    loggedIn: false,
    fullControl: false,
    changedPassword: false,
    releaseFunds: false,
  });
  const releaseFunds = useReleaseFunds();

  const allChecked =
    checkboxes.loggedIn &&
    checkboxes.fullControl &&
    checkboxes.changedPassword &&
    checkboxes.releaseFunds;

  const handleConfirm = () => {
    if (!allChecked) {
      return;
    }

    releaseFunds.mutate(
      {
        transactionId,
        data: {
          confirm_ownership: true,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setCheckboxes({
            loggedIn: false,
            fullControl: false,
            changedPassword: false,
            releaseFunds: false,
          });
          onConfirmSuccess?.();
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

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="logged-in"
                checked={checkboxes.loggedIn}
                onChange={(e) =>
                  setCheckboxes({ ...checkboxes, loggedIn: e.target.checked })
                }
                className="mt-1"
              />
              <label
                htmlFor="logged-in"
                className="text-sm text-foreground cursor-pointer flex-1"
              >
                I have successfully logged into the account
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="full-control"
                checked={checkboxes.fullControl}
                onChange={(e) =>
                  setCheckboxes({ ...checkboxes, fullControl: e.target.checked })
                }
                className="mt-1"
              />
              <label
                htmlFor="full-control"
                className="text-sm text-foreground cursor-pointer flex-1"
              >
                I have full control (email, 2FA, recovery)
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="changed-password"
                checked={checkboxes.changedPassword}
                onChange={(e) =>
                  setCheckboxes({ ...checkboxes, changedPassword: e.target.checked })
                }
                className="mt-1"
              />
              <label
                htmlFor="changed-password"
                className="text-sm text-foreground cursor-pointer flex-1"
              >
                I have changed password and secured the account
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="release-funds"
                checked={checkboxes.releaseFunds}
                onChange={(e) =>
                  setCheckboxes({ ...checkboxes, releaseFunds: e.target.checked })
                }
                className="mt-1"
              />
              <label
                htmlFor="release-funds"
                className="text-sm text-foreground cursor-pointer flex-1"
              >
                I release funds to seller – this is irreversible
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allChecked || releaseFunds.isPending}
            className="bg-primary"
          >
            {releaseFunds.isPending ? (
              'Releasing Funds...'
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


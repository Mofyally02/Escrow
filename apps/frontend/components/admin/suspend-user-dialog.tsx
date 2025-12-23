'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, notes?: string) => void;
  userEmail: string;
  isLoading?: boolean;
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userEmail,
  isLoading,
}: SuspendUserDialogProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 10) {
      return;
    }
    onConfirm(reason.trim(), notes.trim() || undefined);
    setReason('');
    setNotes('');
  };

  const handleCancel = () => {
    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Suspend User Account
          </DialogTitle>
          <DialogDescription>
            Suspend account for <strong>{userEmail}</strong>. The user will receive
            an email notification with the reason and a link to contact support.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>The user will be unable to access their account</li>
                  <li>An email notification will be sent automatically</li>
                  <li>This action can be reversed by unsuspending the account</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">
              Reason for Suspension <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for suspending this account (minimum 10 characters)..."
              className="mt-1 min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 characters (minimum 10 required)
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or context..."
              className="mt-1 min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {notes.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || reason.trim().length < 10 || isLoading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isLoading ? 'Suspending...' : 'Suspend Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


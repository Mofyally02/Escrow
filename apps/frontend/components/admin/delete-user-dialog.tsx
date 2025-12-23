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
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userEmail: string;
  isLoading?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userEmail,
  isLoading,
}: DeleteUserDialogProps) {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 10 || confirmText !== 'DELETE') {
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setConfirmText('');
  };

  const handleCancel = () => {
    setReason('');
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            Permanently delete account for <strong>{userEmail}</strong>. This action
            cannot be undone and will delete all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Warning: This action is irreversible!</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All user data will be permanently deleted</li>
                  <li>All listings, transactions, and associated data will be removed</li>
                  <li>This action cannot be undone</li>
                  <li>Admin accounts cannot be deleted</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">
              Reason for Deletion <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for deleting this account (minimum 10 characters)..."
              className="mt-1 min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 characters (minimum 10 required)
            </p>
          </div>

          <div>
            <Label htmlFor="confirm">
              Type <strong>DELETE</strong> to confirm{' '}
              <span className="text-destructive">*</span>
            </Label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-destructive"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !reason.trim() ||
              reason.trim().length < 10 ||
              confirmText !== 'DELETE' ||
              isLoading
            }
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Account Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


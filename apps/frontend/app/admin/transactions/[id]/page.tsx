'use client';

import { useParams } from 'next/navigation';
import { useAdminTransaction, useForceRelease, useForceRefund } from '@/lib/hooks/useAdminData';
import { TransactionTimeline } from '@/components/buyer/transaction-timeline';
import { DisputeResolutionDialog } from '@/components/admin/dispute-resolution-dialog';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function AdminTransactionDetailPage() {
  const params = useParams();
  const transactionId = parseInt(params?.id as string);
  const { user } = useAuth();
  const { data: transaction, isLoading } = useAdminTransaction(transactionId);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const canResolveDispute =
    isSuperAdmin &&
    transaction &&
    (transaction.state === 'disputed' ||
      transaction.state === 'credentials_released');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Transaction not found</p>
          <Button asChild>
            <Link href="/admin/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild>
              <Link href="/admin/transactions">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Link>
            </Button>
            <div className="mt-4">
              <h1 className="text-3xl font-bold mb-2">
                Transaction #{transaction.id}
              </h1>
              <p className="text-muted-foreground">
                {transaction.listing?.title || 'N/A'}
              </p>
            </div>
          </div>

          {/* Transaction Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <TransactionTimeline currentState={transaction.state} />
          </div>

          {/* Transaction Details */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold">Transaction Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Amount
                </label>
                <p className="mt-1 font-semibold text-2xl">
                  {formatPrice(transaction.amount_usd)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  State
                </label>
                <p className="mt-1 capitalize">{transaction.state.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Buyer
                </label>
                <p className="mt-1">{transaction.buyer?.full_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.buyer?.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller
                </label>
                <p className="mt-1">{transaction.seller?.full_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.seller?.email || 'N/A'}
                </p>
              </div>
            </div>

            {/* Contract */}
            {transaction.contract && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Contract
                </label>
                {transaction.contract.pdf_url && (
                  <Button variant="outline" asChild className="mt-2">
                    <a
                      href={transaction.contract.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Contract PDF
                    </a>
                  </Button>
                )}
                {transaction.contract.signed_by_name && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Signed by: {transaction.contract.signed_by_name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Super Admin Dispute Resolution */}
          {canResolveDispute && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Super Admin Dispute Resolution
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Use these actions only in dispute scenarios. All actions
                    are logged immutably.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() => setShowReleaseDialog(true)}
                >
                  Force Release Funds
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRefundDialog(true)}
                >
                  Force Refund
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* Dispute Resolution Dialogs */}
      <DisputeResolutionDialog
        transactionId={transactionId}
        action="release"
        open={showReleaseDialog}
        onOpenChange={setShowReleaseDialog}
      />
      <DisputeResolutionDialog
        transactionId={transactionId}
        action="refund"
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
      />
    </div>
  );
}

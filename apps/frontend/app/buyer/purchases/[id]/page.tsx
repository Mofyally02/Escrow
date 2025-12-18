'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useTransactionDetail, useRevealCredentials } from '@/lib/hooks/useBuyerTransactions';
import { TransactionTimeline } from '@/components/buyer/transaction-timeline';
import { PaystackCheckoutButton } from '@/components/buyer/paystack-checkout-button';
import { ContractSigner } from '@/components/buyer/contract-signer';
import { AccessConfirmationDialog } from '@/components/buyer/access-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Shield, LockKeyhole, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = parseInt(params?.id as string);
  const { user } = useAuth();
  const { data: transaction, isLoading } = useTransactionDetail(transactionId);
  const revealCredentials = useRevealCredentials();
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleRevealCredentials = () => {
    if (!password) {
      setShowPasswordInput(true);
      return;
    }

    revealCredentials.mutate(
      { transactionId, userPassword: password },
      {
        onSuccess: (data) => {
          setCredentials(data);
          setShowCredentials(true);
          setShowPasswordInput(false);
          setPassword('');
          toast.success('Credentials revealed! Save them securely.');
        },
        onError: () => {
          setPassword('');
        },
      }
    );
  };

  const handlePaymentSuccess = () => {
    // Refetch transaction to get updated state
    window.location.reload();
  };

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
            <a href="/buyer/purchases">Back to Purchases</a>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const canRevealCredentials =
    transaction.state === 'contract_signed' || transaction.state === 'credentials_released';
  const canConfirmAccess =
    transaction.state === 'credentials_released' && !transaction.buyer_confirmed_access;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {transaction.listing?.title || `Transaction #${transaction.id}`}
            </h1>
            <p className="text-muted-foreground">
              {transaction.listing?.category} • {transaction.listing?.platform}
            </p>
          </div>

          {/* Transaction Timeline */}
          <div className="bg-card border rounded-lg p-6">
            <TransactionTimeline currentState={transaction.state} />
          </div>

          {/* Order Summary */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold">{formatPrice(transaction.amount_usd)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(transaction.amount_usd)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {transaction.state === 'pending' && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
              <p className="text-muted-foreground mb-4">
                Your funds will be held securely in escrow until you confirm
                successful account access.
              </p>
              <PaystackCheckoutButton
                transactionId={transactionId}
                amount={transaction.amount_usd}
                email={user?.email || ''}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}

          {/* Contract Signing */}
          {(transaction.state === 'funds_held' ||
            transaction.state === 'contract_signed') && (
            <ContractSigner
              transactionId={transactionId}
              contractPdfUrl={transaction.contract?.pdf_url}
              isSigned={transaction.state === 'contract_signed'}
              signedByName={transaction.contract?.signed_by_name}
              signedAt={transaction.contract?.signed_at}
            />
          )}

          {/* Credential Reveal */}
          {canRevealCredentials && !showCredentials && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Reveal Credentials</h3>
                  <p className="text-sm text-muted-foreground">
                    Once revealed, credentials will be shown only once. Make
                    sure to save them securely. You'll need your account password to decrypt.
                  </p>
                </div>
              </div>

              {showPasswordInput ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="reveal-password"
                      className="block text-sm font-medium mb-2"
                    >
                      Enter Your Account Password
                    </label>
                    <input
                      id="reveal-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your account password"
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This password is used to decrypt your credentials. It's not stored or logged.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRevealCredentials}
                      disabled={!password || revealCredentials.isPending}
                      size="lg"
                      className="flex-1"
                    >
                      {revealCredentials.isPending ? (
                        'Revealing...'
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Reveal Credentials
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordInput(false);
                        setPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowPasswordInput(true)}
                  size="lg"
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Reveal Credentials
                </Button>
              )}
            </div>
          )}

          {/* Credentials Display (One-time) */}
          {showCredentials && credentials && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  Save These Credentials Now
                </h3>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-yellow-900">
                    Username
                  </label>
                  <div className="mt-1 p-3 bg-white border border-yellow-300 rounded-md font-mono">
                    {credentials.username}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-yellow-900">
                    Password
                  </label>
                  <div className="mt-1 p-3 bg-white border border-yellow-300 rounded-md font-mono">
                    {credentials.password}
                  </div>
                </div>
                {credentials.recovery_email && (
                  <div>
                    <label className="text-sm font-medium text-yellow-900">
                      Recovery Email
                    </label>
                    <div className="mt-1 p-3 bg-white border border-yellow-300 rounded-md">
                      {credentials.recovery_email}
                    </div>
                  </div>
                )}
                {credentials.two_fa_secret && (
                  <div>
                    <label className="text-sm font-medium text-yellow-900">
                      2FA Secret
                    </label>
                    <div className="mt-1 p-3 bg-white border border-yellow-300 rounded-md font-mono">
                      {credentials.two_fa_secret}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-yellow-800 mb-4">
                ⚠️ These credentials will not be shown again. Please save them
                securely.
              </p>
            </div>
          )}

          {/* Access Confirmation */}
          {canConfirmAccess && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Confirm Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you've successfully logged into the account, confirm
                    access to release payment to the seller.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowConfirmDialog(true)}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I Have Successfully Logged In
              </Button>
            </div>
          )}

          {/* Completed State */}
          {transaction.state === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                Transaction Completed!
              </h3>
              <p className="text-green-800">
                Payment has been released to the seller. Thank you for using
                ESCROW!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Access Confirmation Dialog */}
      <AccessConfirmationDialog
        transactionId={transactionId}
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      />
    </div>
  );
}


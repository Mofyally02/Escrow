'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useTransactionDetail } from '@/lib/hooks/useBuyerTransactions';
import { CredentialRevealBox } from '@/components/escrow/credential-reveal-box';
import { ConfirmAccessDialog } from '@/components/escrow/confirm-access-dialog';
import { SuccessConfetti } from '@/components/escrow/success-confetti';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import type { CredentialRevealResponse } from '@/lib/hooks/useEscrowCompletion';

const SELF_DESTRUCT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export default function CredentialRevealPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = parseInt(params?.id as string);
  const { data: transaction, isLoading } = useTransactionDetail(transactionId);

  const [credentials, setCredentials] = useState<CredentialRevealResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SELF_DESTRUCT_TIMEOUT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const credentialsRef = useRef<CredentialRevealResponse | null>(null);

  // Store credentials in ref for cleanup
  useEffect(() => {
    if (credentials) {
      credentialsRef.current = credentials;
    }
  }, [credentials]);

  // Self-destruct timer
  useEffect(() => {
    if (!credentials) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          // Time's up - clear credentials
          handleSelfDestruct();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [credentials]);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear credentials from memory
      setCredentials(null);
      credentialsRef.current = null;
      // Clear session storage
      sessionStorage.removeItem(`credentials_${transactionId}`);
    };
  }, [transactionId]);

  // Warn before leaving page
  useEffect(() => {
    if (!credentials) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your credentials will be cleared.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [credentials]);

  const handleRevealed = (creds: CredentialRevealResponse) => {
    setCredentials(creds);
    // Store in session storage as backup (will be cleared on unmount)
    sessionStorage.setItem(`credentials_${transactionId}`, JSON.stringify(creds));
  };

  const handleSelfDestruct = () => {
    setCredentials(null);
    credentialsRef.current = null;
    sessionStorage.removeItem(`credentials_${transactionId}`);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Redirect after a moment
    setTimeout(() => {
      router.push(`/buyer/purchases/${transactionId}`);
    }, 2000);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            <Link href="/buyer/purchases">Back to Purchases</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if transaction is in correct state
  const canReveal =
    transaction.state === 'contract_signed' || transaction.state === 'funds_held';
  const alreadyRevealed = !!transaction.credentials_released_at;
  const isCompleted = transaction.state === 'completed';

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold">Transaction Already Completed</h1>
            <p className="text-muted-foreground">
              This transaction has already been completed. Credentials are no
              longer available.
            </p>
            <Button asChild>
              <Link href="/buyer/purchases">View My Purchases</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canReveal && !alreadyRevealed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold">Not Ready for Reveal</h1>
            <p className="text-muted-foreground">
              The contract must be signed before credentials can be revealed.
            </p>
            <Button asChild>
              <Link href={`/buyer/purchases/${transactionId}`}>
                View Transaction
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <Button variant="ghost" asChild>
              <Link href={`/buyer/purchases/${transactionId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transaction
              </Link>
            </Button>
            <div className="mt-4">
              <h1 className="text-3xl font-bold mb-2">
                Account Credentials
              </h1>
              <p className="text-muted-foreground">
                Transaction #{transaction.id} - {transaction.listing?.title}
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          {credentials && timeRemaining > 0 && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900">
                    Self-destruct in: {formatTime(timeRemaining)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelfDestruct}
                >
                  Clear Now
                </Button>
              </div>
            </div>
          )}

          {/* Credential Reveal Box */}
          <CredentialRevealBox
            transactionId={transactionId}
            onRevealed={handleRevealed}
          />

          {/* Confirm Access Button */}
          {credentials && (
            <div className="space-y-4">
              <div className="p-6 bg-card border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Next Step: Confirm Access
                </h3>
                <p className="text-muted-foreground mb-4">
                  Once you have successfully logged into the account and verified
                  you have full control, click the button below to confirm and
                  release funds to the seller.
                </p>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  size="lg"
                  className="w-full"
                >
                  I Have Successfully Logged In
                </Button>
              </div>
            </div>
          )}

          {/* Success Message (if already confirmed) */}
          {alreadyRevealed && !credentials && (
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-900 font-semibold">
                ✓ Access already confirmed. Transaction completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmAccessDialog
        transactionId={transactionId}
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onSuccess={() => {
          setShowSuccess(true);
          // Clear credentials after confirmation
          handleSelfDestruct();
        }}
      />

      {/* Success Confetti */}
      {showSuccess && (
        <SuccessConfetti
          onClose={() => {
            setShowSuccess(false);
            router.push('/buyer/purchases');
          }}
        />
      )}
    </div>
  );
}


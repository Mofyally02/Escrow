'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useConfirmPayment } from '@/lib/hooks/useBuyerPurchaseFlow';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = parseInt(params?.id as string);
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref'); // Paystack redirects with this
  const status = searchParams.get('status');
  
  const confirmPayment = useConfirmPayment();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    if (!transactionId || !reference) {
      setPaymentStatus('failed');
      setIsProcessing(false);
      toast.error('Invalid payment callback');
      return;
    }

    // Paystack redirects with trxref (transaction reference) and status
    const paystackRef = trxref || reference;
    
    if (status === 'success' || status === 'successful') {
      // Confirm payment with backend
      confirmPayment.mutate(
        {
          transactionId,
          data: {
            paystack_reference: paystackRef,
          },
        },
        {
          onSuccess: () => {
            setPaymentStatus('success');
            setIsProcessing(false);
            toast.success('Payment confirmed! Funds held in escrow.');
            // Redirect to transaction detail page after 2 seconds
            setTimeout(() => {
              router.push(`/buyer/purchases/${transactionId}`);
            }, 2000);
          },
          onError: (error: any) => {
            setPaymentStatus('failed');
            setIsProcessing(false);
            const message =
              error.response?.data?.detail || 'Failed to confirm payment';
            toast.error(message);
          },
        }
      );
    } else {
      // Payment failed or cancelled
      setPaymentStatus('failed');
      setIsProcessing(false);
      toast.error('Payment was not completed');
    }
  }, [transactionId, reference, trxref, status, confirmPayment, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-card border rounded-lg p-8 text-center space-y-6">
          {isProcessing || paymentStatus === 'processing' ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </div>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-green-900">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your payment has been confirmed. Funds are held securely in escrow.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to transaction details...
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-red-900">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your payment could not be processed. Please try again.
                </p>
                <Button
                  onClick={() => router.push(`/buyer/purchases/${transactionId}`)}
                  className="w-full"
                >
                  Return to Transaction
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


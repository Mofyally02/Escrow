'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

interface PaystackCheckoutButtonProps {
  transactionId: number;
  amount: number; // in cents
  email: string;
  paystackReference?: string | null; // Optional: pass reference directly to avoid extra API call
  authorizationUrl?: string | null; // Optional: pass authorization URL directly
  onSuccess?: (reference: string) => void;
  className?: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackCheckoutButton({
  transactionId,
  amount,
  email,
  paystackReference,
  authorizationUrl,
  onSuccess,
  className,
}: PaystackCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [reference, setReference] = useState<string | null>(paystackReference || null);

  // Load Paystack script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => setPaystackLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else if (window.PaystackPop) {
      setPaystackLoaded(true);
    }
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      let paystackRef = reference;

      // If reference not provided, fetch transaction to get it
      if (!paystackRef) {
        try {
          const transactionResponse = await apiClient.get<any>(
            `/transactions/${transactionId}`
          );
          // Backend returns TransactionDetailResponse directly, not wrapped
          const transaction = transactionResponse.data;
          
          if (!transaction || !transaction.paystack_reference) {
            throw new Error('Payment reference not found. Please try again.');
          }
          
          paystackRef = transaction.paystack_reference;
          setReference(paystackRef);
        } catch (fetchError: any) {
          setIsLoading(false);
          const message =
            fetchError.response?.data?.detail || 
            fetchError.message || 
            'Failed to load transaction details';
          toast.error(message);
          return;
        }
      }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

      if (!paystackKey) {
        throw new Error('Paystack public key not configured');
      }

      // If authorization URL is provided, open in new tab
      if (authorizationUrl) {
        const newWindow = window.open(authorizationUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          toast.error('Please allow popups to complete payment');
          setIsLoading(false);
          return;
        }
        // Monitor the new window for payment completion
        // The callback URL will handle the payment confirmation
        setIsLoading(false);
        toast.info('Payment window opened. Complete payment in the new tab.');
        return;
      }

      // Open Paystack popup
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email,
          amount: amount, // Amount in kobo (Paystack expects smallest currency unit)
          ref: paystackRef,
          callback: (response: any) => {
            // Payment successful - pass reference to parent
            // Note: Paystack callback must be synchronous
            setIsLoading(false);
            if (response && response.reference) {
              // Call onSuccess if provided
              if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response.reference);
              } else {
                toast.success('Payment successful! Funds held in escrow.');
              }
            } else {
              toast.success('Payment successful! Funds held in escrow.');
            }
          },
          onClose: () => {
            setIsLoading(false);
            toast.info('Payment window closed');
          },
        });

        handler.openIframe();
      } else {
        throw new Error('Paystack script not loaded');
      }
    } catch (error: any) {
      setIsLoading(false);
      const message =
        error.response?.data?.detail || error.message || 'Failed to initialize payment';
      toast.error(message);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || !paystackLoaded}
      size="lg"
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay {formatPrice(amount)}
        </>
      )}
    </Button>
  );
}


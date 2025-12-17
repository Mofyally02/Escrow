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
  onSuccess?: () => void;
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
  onSuccess,
  className,
}: PaystackCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

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
      // Get transaction details to get Paystack reference
      const transactionResponse = await apiClient.get<{ transaction: any }>(
        `/transactions/${transactionId}`
      );
      const transaction = transactionResponse.data.transaction;

      if (!transaction.paystack_reference) {
        throw new Error('Payment reference not found');
      }

      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

      if (!paystackKey) {
        throw new Error('Paystack public key not configured');
      }

      // Open Paystack popup
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email,
          amount: amount, // Amount in kobo (Paystack expects smallest currency unit)
          ref: transaction.paystack_reference,
          callback: async (response: any) => {
            // Payment successful - backend webhook will handle verification
            // Just refresh the page to show updated state
            toast.success('Payment successful! Funds held in escrow.');
            setIsLoading(false);
            onSuccess?.();
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


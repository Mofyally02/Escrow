'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FileText, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSignOwnershipAgreement } from '@/lib/hooks/useBuyerPurchaseFlow';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui/loading-button';

interface OwnershipAgreementSignerProps {
  transactionId: number;
  isSigned: boolean;
  onSignSuccess?: () => void;
}

const ownershipAgreementSchema = z.object({
  buyer_full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be less than 255 characters'),
  verified_account: z.boolean().refine((val) => val === true, {
    message: 'You must verify that you have verified the account',
  }),
  accepts_ownership: z.boolean().refine((val) => val === true, {
    message: 'You must accept ownership',
  }),
  accepts_risks: z.boolean().refine((val) => val === true, {
    message: 'You must accept all risks',
  }),
  platform_liability_ends: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge that platform liability ends',
  }),
});

type OwnershipAgreementFormData = z.infer<typeof ownershipAgreementSchema>;

export function OwnershipAgreementSigner({
  transactionId,
  isSigned,
  onSignSuccess,
}: OwnershipAgreementSignerProps) {
  const { user } = useAuth();
  const signOwnershipAgreement = useSignOwnershipAgreement();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OwnershipAgreementFormData>({
    resolver: zodResolver(ownershipAgreementSchema),
    defaultValues: {
      buyer_full_name: user?.full_name || '',
      verified_account: false,
      accepts_ownership: false,
      accepts_risks: false,
      platform_liability_ends: false,
    },
  });

  const signedName = watch('buyer_full_name');
  const verifiedAccount = watch('verified_account');
  const acceptsOwnership = watch('accepts_ownership');
  const acceptsRisks = watch('accepts_risks');
  const platformLiabilityEnds = watch('platform_liability_ends');

  const exactMatch =
    signedName &&
    user?.full_name &&
    signedName.toLowerCase().trim() === user.full_name.toLowerCase().trim();

  const allCheckboxesChecked =
    verifiedAccount && acceptsOwnership && acceptsRisks && platformLiabilityEnds;

  const canSubmit = exactMatch && allCheckboxesChecked;

  const onSubmit = (data: OwnershipAgreementFormData) => {
    if (!exactMatch) {
      toast.error('Name must match your registered full name exactly');
      return;
    }

    if (!allCheckboxesChecked) {
      toast.error('All acknowledgments must be accepted');
      return;
    }

    signOwnershipAgreement.mutate(
      {
        transactionId,
        data: {
          buyer_full_name: data.buyer_full_name,
          verified_account: data.verified_account,
          accepts_ownership: data.accepts_ownership,
          accepts_risks: data.accepts_risks,
          platform_liability_ends: data.platform_liability_ends,
        },
      },
      {
        onSuccess: () => {
          toast.success('Ownership agreement signed! Legally binding.');
          onSignSuccess?.();
        },
      }
    );
  };

  if (isSigned) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Ownership Agreement Signed</h3>
            <p className="text-sm text-green-700">
              You have signed the ownership transfer agreement. You can now proceed to release funds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Sign Ownership Agreement</h3>
          <p className="text-sm text-muted-foreground">
            Sign the ownership transfer agreement to proceed. This is a legally binding document.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name Input */}
        <div>
          <label
            htmlFor="buyer_full_name"
            className="block text-sm font-medium mb-2"
          >
            Full Legal Name
          </label>
          <input
            id="buyer_full_name"
            type="text"
            {...register('buyer_full_name')}
            placeholder="Enter your full legal name"
            className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg font-medium"
          />
          {errors.buyer_full_name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.buyer_full_name.message}
            </p>
          )}
          {signedName && !exactMatch && (
            <p className="mt-1 text-sm text-yellow-600">
              ⚠️ Name must match: {user?.full_name}
            </p>
          )}
          {signedName && exactMatch && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Name matches your registration
            </p>
          )}
        </div>

        {/* Mandatory Checkboxes */}
        <div className="bg-muted/50 rounded-md p-4 space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="verified_account"
              {...register('verified_account')}
              className="mt-1"
            />
            <label
              htmlFor="verified_account"
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              <span className="font-medium">I have verified the account</span>
              <span className="text-muted-foreground block mt-1">
                I have successfully logged in and verified that the account is as described.
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="accepts_ownership"
              {...register('accepts_ownership')}
              className="mt-1"
            />
            <label
              htmlFor="accepts_ownership"
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              <span className="font-medium">I accept full ownership</span>
              <span className="text-muted-foreground block mt-1">
                I accept full ownership and responsibility for this account.
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="accepts_risks"
              {...register('accepts_risks')}
              className="mt-1"
            />
            <label
              htmlFor="accepts_risks"
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              <span className="font-medium">I accept all risks after transfer</span>
              <span className="text-muted-foreground block mt-1">
                I understand and accept all risks associated with account ownership, including
                platform ToS violations.
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="platform_liability_ends"
              {...register('platform_liability_ends')}
              className="mt-1"
            />
            <label
              htmlFor="platform_liability_ends"
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              <span className="font-medium">Platform liability ends at release</span>
              <span className="text-muted-foreground block mt-1">
                I acknowledge that ESCROW platform liability ends once funds are released to the
                seller.
              </span>
            </label>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Legal Notice:</p>
              <p>
                By signing this agreement, you are entering into a legally binding contract. Make
                sure you have verified the account and are ready to assume full ownership before
                proceeding.
              </p>
            </div>
          </div>
        </div>

        <LoadingButton
          type="submit"
          className="w-full"
          disabled={!canSubmit}
          size="lg"
          isLoading={signOwnershipAgreement.isPending}
          loadingText="Signing Agreement..."
        >
          <Shield className="h-4 w-4 mr-2" />
          Sign Ownership Agreement
        </LoadingButton>
      </form>
    </div>
  );
}


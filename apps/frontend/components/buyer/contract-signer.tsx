'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FileText, Shield, CheckCircle2 } from 'lucide-react';
import { useSignContract } from '@/lib/hooks/useBuyerTransactions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContractSignerProps {
  transactionId: number;
  contractPdfUrl?: string | null;
  isSigned: boolean;
  signedByName?: string | null;
  signedAt?: string | null;
}

const contractSignSchema = z.object({
  signed_by_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
});

type ContractSignFormData = z.infer<typeof contractSignSchema>;

export function ContractSigner({
  transactionId,
  contractPdfUrl,
  isSigned,
  signedByName,
  signedAt,
}: ContractSignerProps) {
  const { user } = useAuth();
  const signContract = useSignContract();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ContractSignFormData>({
    resolver: zodResolver(contractSignSchema),
    defaultValues: {
      signed_by_name: user?.full_name || '',
    },
  });

  const signedName = watch('signed_by_name');
  const exactMatch =
    signedName &&
    user?.full_name &&
    signedName.toLowerCase().trim() === user.full_name.toLowerCase().trim();

  const onSubmit = (data: ContractSignFormData) => {
    if (!exactMatch) {
      toast.error('Name must match your registered full name exactly');
      return;
    }

    signContract.mutate({
      transactionId,
      data: { signed_by_name: data.signed_by_name },
    });
  };

  if (isSigned) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Contract Signed</h3>
            <p className="text-sm text-green-700">
              Signed by: {signedByName}
            </p>
            {signedAt && (
              <p className="text-xs text-green-600 mt-1">
                {new Date(signedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {contractPdfUrl && (
          <Button variant="outline" asChild className="w-full">
            <a href={contractPdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4 mr-2" />
              View Signed Contract PDF
            </a>
          </Button>
        )}
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
          <h3 className="font-semibold mb-1">Sign Digital Contract</h3>
          <p className="text-sm text-muted-foreground">
            Type your full legal name exactly as registered to sign this
            legally-binding contract.
          </p>
        </div>
      </div>

      {contractPdfUrl && (
        <div>
          <Button variant="outline" asChild className="w-full">
            <a href={contractPdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4 mr-2" />
              Review Contract PDF
            </a>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="signed_by_name"
            className="block text-sm font-medium mb-2"
          >
            Full Legal Name
          </label>
          <input
            id="signed_by_name"
            type="text"
            {...register('signed_by_name')}
            placeholder="Enter your full legal name"
            className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg font-medium"
          />
          {errors.signed_by_name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.signed_by_name.message}
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

        <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">By signing, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Purchase the account as described</li>
            <li>Assume all risks of platform ToS violations</li>
            <li>Confirm access before funds are released</li>
          </ul>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!exactMatch || signContract.isPending}
          size="lg"
        >
          {signContract.isPending ? (
            'Signing Contract...'
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Sign Contract
            </>
          )}
        </Button>
      </form>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthCard } from './auth-card';
import { OTPInput } from './otp-input';
import { ResendOTPButton } from './resend-otp-button';
import { Shield } from 'lucide-react';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function VerifyLoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');

  const verifyMutation = useMutation({
    mutationFn: async (data: { otp: string }) => {
      // Note: Backend login flow may need identifier + OTP
      // For now, using a generic verify endpoint if available
      // Otherwise, this will need to be adjusted based on actual backend implementation
      const response = await apiClient.post('/auth/verify-otp', {
        code: data.otp,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Login successful! Redirecting...');
      
      // Redirect based on user role
      const user = data.user;
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'seller') {
        router.push('/seller/dashboard');
      } else {
        router.push('/buyer/dashboard');
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'OTP verification failed. Please try again.';
      toast.error(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/resend-otp', { type: 'email' });
    },
    onSuccess: () => {
      toast.success('OTP resent!');
    },
    onError: () => {
      toast.error('Failed to resend OTP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      verifyMutation.mutate({ otp });
    }
  };

  return (
    <AuthCard
      title="Verify Your Identity"
      description="Enter the OTP code sent to your email or phone"
      step={{ current: 2, total: 2 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <label className="text-sm font-medium">Verification Code</label>
          </div>
          <OTPInput
            value={otp}
            onChange={setOtp}
            error={verifyMutation.isError}
          />
          <ResendOTPButton
            onResend={() => resendMutation.mutateAsync()}
            disabled={resendMutation.isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={otp.length !== 6 || verifyMutation.isPending}
        >
          {verifyMutation.isPending ? 'Verifying...' : 'Verify & Sign In'}
        </Button>
      </form>
    </AuthCard>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthCard } from './auth-card';
import { OTPInput } from './otp-input';
import { ResendOTPButton } from './resend-otp-button';
import { Mail, Phone } from 'lucide-react';
import apiClient from '@/lib/api';

export function VerifyRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Get email and phone from URL params or localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('register_email');
    const storedPhone = localStorage.getItem('register_phone');
    if (storedEmail) setEmail(storedEmail);
    if (storedPhone) setPhone(storedPhone);
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (data: { email_otp: string; phone_otp: string; email: string; phone: string }) => {
      // Verify email OTP
      const emailResponse = await apiClient.post('/auth/verify-email', {
        code: data.email_otp,
        email: data.email,
      });
      // Verify phone OTP
      const phoneResponse = await apiClient.post('/auth/verify-phone', {
        code: data.phone_otp,
        phone: data.phone,
      });
      return { email: emailResponse.data, phone: phoneResponse.data };
    },
    onSuccess: () => {
      // Clear stored email/phone
      localStorage.removeItem('register_email');
      localStorage.removeItem('register_phone');
      toast.success('Account verified! Redirecting...');
      router.push('/register/success');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Verification failed. Please try again.';
      toast.error(message);
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/resend-otp', { type: 'email' });
    },
    onSuccess: () => {
      toast.success('Email OTP resent!');
    },
    onError: () => {
      toast.error('Failed to resend email OTP');
    },
  });

  const resendPhoneMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/resend-otp', { type: 'phone' });
    },
    onSuccess: () => {
      toast.success('Phone OTP resent!');
    },
    onError: () => {
      toast.error('Failed to resend phone OTP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length === 6 && phoneOtp.length === 6 && email && phone) {
      verifyMutation.mutate({ 
        email_otp: emailOtp, 
        phone_otp: phoneOtp,
        email,
        phone,
      });
    } else if (!email || !phone) {
      toast.error('Email and phone information missing. Please register again.');
      router.push('/register');
    }
  };

  return (
    <AuthCard
      title="Verify Your Account"
      description="Enter the OTP codes sent to your email and phone"
      step={{ current: 2, total: 2 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email OTP */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Email Verification Code</label>
          </div>
          <OTPInput
            value={emailOtp}
            onChange={setEmailOtp}
            error={verifyMutation.isError}
          />
          <ResendOTPButton
            onResend={() => resendEmailMutation.mutateAsync()}
            disabled={resendEmailMutation.isPending}
          />
        </div>

        {/* Phone OTP */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Phone Verification Code</label>
          </div>
          <OTPInput
            value={phoneOtp}
            onChange={setPhoneOtp}
            error={verifyMutation.isError}
          />
          <ResendOTPButton
            onResend={() => resendPhoneMutation.mutateAsync()}
            disabled={resendPhoneMutation.isPending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            emailOtp.length !== 6 ||
            phoneOtp.length !== 6 ||
            verifyMutation.isPending
          }
        >
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Account'}
        </Button>
      </form>
    </AuthCard>
  );
}


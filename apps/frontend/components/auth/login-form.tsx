'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthCard } from './auth-card';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import apiClient from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Login successful! Please verify with OTP.');
      router.push('/login/verify');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to your ESCROW account"
      step={{ current: 1, total: 2 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium mb-1">
            Email or Phone Number
          </label>
          <input
            id="identifier"
            type="text"
            {...register('identifier')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com or +1234567890"
          />
          {errors.identifier && (
            <p className="mt-1 text-sm text-destructive">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loginMutation.isPending}
        >
          {isSubmitting || loginMutation.isPending ? 'Signing In...' : 'Continue'}
        </Button>
      </form>
    </AuthCard>
  );
}


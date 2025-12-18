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
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens in localStorage
      if (data?.access_token && typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data?.refresh_token && typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      toast.success('Login successful! Redirecting...');
      // Use replace to prevent back navigation and avoid refresh loops
      setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
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
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-destructive">
              {errors.email.message}
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
          {isSubmitting || loginMutation.isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </AuthCard>
  );
}


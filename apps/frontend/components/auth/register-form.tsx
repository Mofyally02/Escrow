'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthCard } from './auth-card';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import apiClient from '@/lib/api';

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Registration successful! Please login to continue.');
      router.push('/login');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Create Your Account"
      description="Join ESCROW to buy or sell freelance accounts safely"
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
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+1234567890"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Include country code (e.g., +1 for US)
          </p>
          {errors.phone && (
            <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            {...register('full_name')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="John Doe"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-destructive">
              {errors.full_name.message}
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
          <p className="mt-1 text-xs text-muted-foreground">
            At least 8 characters with uppercase, lowercase, and number
          </p>
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || registerMutation.isPending}
        >
          {isSubmitting || registerMutation.isPending
            ? 'Creating Account...'
            : 'Continue'}
        </Button>
      </form>
    </AuthCard>
  );
}


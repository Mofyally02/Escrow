'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

const credentialSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    recovery_email: z.string().email('Invalid email').optional().or(z.literal('')),
    two_fa_secret: z.string().optional(),
    user_password: z.string().min(8, 'Your account password is required for encryption'),
  })
  .refine((data) => data.password !== data.user_password, {
    message: 'Account password cannot be the same as the listing password',
    path: ['user_password'],
  });

export type CredentialFormData = z.infer<typeof credentialSchema>;

interface CredentialFormProps {
  defaultValues?: Partial<CredentialFormData>;
  onSubmit: (data: CredentialFormData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function CredentialForm({
  defaultValues,
  onSubmit,
  onBack,
  isLoading,
}: CredentialFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Security Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Your credentials are encrypted instantly</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Encrypted with AES-256-GCM before storage</li>
              <li>Admins verify ownership without seeing your password</li>
              <li>Credentials revealed only once to buyer after full escrow</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Username */}
      <div>
        <Label htmlFor="username">Account Username/Email *</Label>
        <Input
          id="username"
          type="text"
          {...register('username')}
          placeholder="username@example.com or username123"
          className="mt-1 font-mono"
        />
        {errors.username && (
          <p className="text-sm text-destructive mt-1">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">Account Password *</Label>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Enter the account password"
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Recovery Email */}
      <div>
        <Label htmlFor="recovery_email">Recovery Email</Label>
        <Input
          id="recovery_email"
          type="email"
          {...register('recovery_email')}
          placeholder="recovery@example.com"
          className="mt-1"
        />
        {errors.recovery_email && (
          <p className="text-sm text-destructive mt-1">
            {errors.recovery_email.message}
          </p>
        )}
      </div>

      {/* 2FA Secret */}
      <div>
        <Label htmlFor="two_fa_secret">2FA Secret (if applicable)</Label>
        <div className="relative mt-1">
          <Input
            id="two_fa_secret"
            type={show2FA ? 'text' : 'password'}
            {...register('two_fa_secret')}
            placeholder="Enter 2FA secret key"
            className="pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShow2FA(!show2FA)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show2FA ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.two_fa_secret && (
          <p className="text-sm text-destructive mt-1">
            {errors.two_fa_secret.message}
          </p>
        )}
      </div>

      {/* User Password for Encryption */}
      <div>
        <Label htmlFor="user_password">
          Your Account Password (for encryption) *
        </Label>
        <div className="relative mt-1">
          <Input
            id="user_password"
            type={showUserPassword ? 'text' : 'password'}
            {...register('user_password')}
            placeholder="Enter your ESCROW account password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowUserPassword(!showUserPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showUserPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This password is used to derive the encryption key. It's never stored or logged.
        </p>
        {errors.user_password && (
          <p className="text-sm text-destructive mt-1">
            {errors.user_password.message}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="ml-auto">
          {isLoading ? 'Encrypting...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}


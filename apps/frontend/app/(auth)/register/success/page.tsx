'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegisterSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <AuthCard
      title="Account Activated!"
      description="Your account has been successfully verified"
    >
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Welcome to ESCROW!</p>
          <p className="text-sm text-muted-foreground">
            Your account is now active. You can start buying or selling freelance
            accounts.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/catalog">Browse Listings</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Redirecting to dashboard in 3 seconds...
        </p>
      </div>
    </AuthCard>
  );
}


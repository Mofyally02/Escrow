'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      // Redirect based on role
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'seller') {
        router.push('/seller/dashboard');
      } else {
        router.push('/buyer/dashboard');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}


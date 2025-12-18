'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    if (!isLoading && !isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      // Redirect based on role - admins go to admin dashboard, others to buyer
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'seller') {
        // Sellers can also buy, so show unified dashboard
        router.replace('/buyer/dashboard');
      } else {
        router.replace('/buyer/dashboard');
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


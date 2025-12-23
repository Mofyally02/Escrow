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
      // All authenticated users can access both buyer and seller routes
      // Redirect admins to admin dashboard, others to buyer dashboard
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.replace('/admin/dashboard');
      } else {
        // Default to buyer dashboard - users can easily switch to seller routes via navbar
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


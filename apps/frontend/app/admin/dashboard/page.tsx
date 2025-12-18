'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAdminAnalytics } from '@/lib/hooks/useAdminData';
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { Button } from '@/components/ui/button';
import { Shield, FileText, ShoppingBag, UsersRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Admin access required</p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage listings, transactions, and platform operations
          </p>
        </div>

        {/* Analytics Cards */}
        {analytics && <AnalyticsCards data={analytics} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link
            href="/admin/listings"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Moderation Queue</h3>
                <p className="text-sm text-muted-foreground">
                  Review pending listings
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          <Link
            href="/admin/transactions"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor escrow activity
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <UsersRound className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Users</h3>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Platform insights
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

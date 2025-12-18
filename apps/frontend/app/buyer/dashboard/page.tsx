'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserMode } from '@/hooks/useUserMode';
import { useBuyerTransactions } from '@/lib/hooks/useBuyerTransactions';
import { Button } from '@/components/ui/button';
import { ModeSwitcher } from '@/components/common/mode-switcher';
import { Shield, ShoppingBag, CheckCircle2, DollarSign, ArrowRight, Store, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export default function BuyerDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { mode, changeMode, canSell, hasBothModes } = useUserMode();
  const { data: transactions, isLoading: transactionsLoading } =
    useBuyerTransactions();

  const stats = useMemo(() => {
    if (!transactions) return null;

    const active = transactions.filter(
      (t) =>
        !['completed', 'refunded'].includes(t.state) && t.state !== 'disputed'
    ).length;
    const completed = transactions.filter((t) => t.state === 'completed').length;
    const fundsInEscrow = transactions
      .filter((t) => ['funds_held', 'contract_signed', 'credentials_released'].includes(t.state))
      .reduce((sum, t) => sum + t.amount_usd, 0);

    return {
      active,
      completed,
      fundsInEscrow,
    };
  }, [transactions]);

  if (authLoading || transactionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to view your dashboard</p>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.full_name}!
              </h1>
              <p className="text-muted-foreground">
                {mode === 'buyer' 
                  ? 'Manage your purchases and track your transactions'
                  : 'Manage your listings and track your sales'}
              </p>
            </div>
            {hasBothModes && (
              <ModeSwitcher
                currentMode="both"
                onModeChange={changeMode}
              />
            )}
          </div>
          
          {/* Quick Switch Actions */}
          {hasBothModes && (
            <div className="flex gap-3 flex-wrap">
              {mode === 'buyer' && (
                <Button variant="outline" asChild>
                  <Link href="/seller/dashboard">
                    <Store className="h-4 w-4 mr-2" />
                    Switch to Selling Mode
                  </Link>
                </Button>
              )}
              {mode === 'seller' && (
                <Button variant="outline" asChild>
                  <Link href="/buyer/dashboard">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Switch to Buying Mode
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Active Purchases
                  </p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Completed
                  </p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Funds in Escrow
                  </p>
                  <p className="text-3xl font-bold">
                    ${(stats.fundsInEscrow / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-background border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/catalog">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Browse Catalog
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/buyer/purchases">View All Purchases</Link>
              </Button>
              {canSell && (
                <>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/seller/dashboard">
                      <Store className="h-4 w-4 mr-2" />
                      My Listings
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/seller/submit">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Listing
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Purchases</h2>
            <Button variant="ghost" asChild>
              <Link href="/buyer/purchases">View All</Link>
            </Button>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-card border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {transaction.listing?.title || `Transaction #${transaction.id}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(transaction.amount_usd / 100).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/buyer/purchases/${transaction.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't made any purchases yet
              </p>
              <Button asChild>
                <Link href="/catalog">Browse Catalog</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


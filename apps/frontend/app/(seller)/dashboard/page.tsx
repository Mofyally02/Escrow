'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSellerListings } from '@/lib/hooks/useSellerListings';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Clock, CheckCircle2, ShoppingBag, DollarSign, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';

export default function SellerDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: listings, isLoading: listingsLoading } = useSellerListings();

  const stats = useMemo(() => {
    if (!listings) return null;

    const total = listings.length;
    const pending = listings.filter((l) => l.state === 'under_review').length;
    const live = listings.filter((l) => l.state === 'approved').length;
    const sold = listings.filter((l) => l.state === 'sold').length;
    const totalEarnings = listings
      .filter((l) => l.state === 'sold')
      .reduce((sum, l) => sum + l.price_usd, 0);

    return {
      total,
      pending,
      live,
      sold,
      totalEarnings,
    };
  }, [listings]);

  if (authLoading || listingsLoading) {
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
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your listings and track your earnings
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Listings
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Under Review
                  </p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Live</p>
                  <p className="text-3xl font-bold">{stats.live}</p>
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
                    Total Earnings
                  </p>
                  <p className="text-3xl font-bold">
                    ${(stats.totalEarnings / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <DollarSign className="h-6 w-6 text-primary" />
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
                <Link href="/seller/listings/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit New Account
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/seller/listings">
                  View All Listings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Listings</h2>
            <Button variant="ghost" asChild>
              <Link href="/seller/listings">View All</Link>
            </Button>
          </div>

          {listings && listings.length > 0 ? (
            <div className="space-y-4">
              {listings.slice(0, 5).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/seller/listings/${listing.id}`}
                  className="block bg-card border rounded-lg p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{listing.title}</h3>
                        <ListingStatusBadge state={listing.state} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{listing.category}</span>
                        <span>•</span>
                        <span>{listing.platform}</span>
                        <span>•</span>
                        <span>
                          ${(listing.price_usd / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't created any listings yet
              </p>
              <Button asChild>
                <Link href="/seller/listings/new">Submit Your First Listing</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


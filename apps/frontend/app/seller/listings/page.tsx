'use client';

import { useState, useMemo } from 'react';
import { useSellerListings } from '@/lib/hooks/useSellerListings';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';
import { ListingCard } from '@/components/seller/listing-card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Grid3x3, List } from 'lucide-react';
import Link from 'next/link';
import { ListingState } from '@/types/listing';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'table';

export default function SellerListingsPage() {
  const { data: listings, isLoading } = useSellerListings();
  const [filter, setFilter] = useState<ListingState | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredListings = useMemo(() => {
    if (!listings) return [];

    if (filter === 'all') return listings;
    return listings.filter((l) => l.state === filter);
  }, [listings, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">
              Manage all your submitted freelance accounts
            </p>
          </div>
          <Button asChild>
            <Link href="/seller/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('draft')}
            >
              Draft
            </Button>
            <Button
              variant={filter === 'under_review' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('under_review')}
            >
              Under Review
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              Approved
            </Button>
            <Button
              variant={filter === 'sold' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('sold')}
            >
              Sold
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Listings Display */}
        {filteredListings && filteredListings.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredListings.map((listing) => (
                      <tr
                        key={listing.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/seller/listings/${listing.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {listing.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {listing.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {listing.platform}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          ${(listing.price_usd / 100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <ListingStatusBadge state={listing.state} />
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/seller/listings/${listing.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="bg-card border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? "You haven't created any listings yet"
                : `No ${filter} listings found`}
            </p>
            <Button asChild>
              <Link href="/seller/listings/new">Create Your First Listing</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


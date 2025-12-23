'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';
import { Button } from '@/components/ui/button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { AdminListing } from '@/types/admin';
import { formatPrice } from '@/lib/utils';
import { FileText, User, Calendar } from 'lucide-react';

interface ModerationQueueGridProps {
  listings: AdminListing[];
  isLoading?: boolean;
}

export const ModerationQueueGrid = memo(function ModerationQueueGrid({
  listings,
  isLoading,
}: ModerationQueueGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card border rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings to review</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Link
          key={listing.id}
          href={`/admin/listings/${listing.id}`}
          className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all group"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{listing.category}</span>
                </div>
              </div>
              <ListingStatusBadge state={listing.state} />
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {listing.seller?.full_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Platform</span>
                <span className="text-sm font-medium">{listing.platform}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-semibold">
                  {formatPrice(listing.price_usd)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(listing.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <InteractiveButton
              variant="outline"
              size="sm"
              className="w-full mt-4"
              immediateFeedback={true}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/admin/listings/${listing.id}`;
              }}
            >
              Review Listing
            </InteractiveButton>
          </div>
        </Link>
      ))}
    </div>
  );
});


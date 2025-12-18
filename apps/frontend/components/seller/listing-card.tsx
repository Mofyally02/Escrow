'use client';

import Link from 'next/link';
import { Shield, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { Listing } from '@/types/listing';
import { ListingStatusBadge } from './listing-status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className }: ListingCardProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatEarnings = (cents: number | null) => {
    if (!cents) return 'N/A';
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}/mo`;
  };

  return (
    <div
      className={cn(
        'bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <ListingStatusBadge state={listing.state} />
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 mb-1">
              {listing.title}
            </h3>
          </div>
        </div>

        {/* Category & Platform */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
            {listing.category}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
            {listing.platform}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span>Price</span>
            </div>
            <p className="text-lg font-bold text-primary">
              {formatPrice(listing.price_usd)}
            </p>
          </div>
          {listing.monthly_earnings && (
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span>Earnings</span>
              </div>
              <p className="text-sm font-semibold">
                {formatEarnings(listing.monthly_earnings)}
              </p>
            </div>
          )}
          {listing.account_age_months && (
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span>Age</span>
              </div>
              <p className="text-sm font-semibold">
                {listing.account_age_months} months
              </p>
            </div>
          )}
          {listing.rating && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Rating</div>
              <p className="text-sm font-semibold">{listing.rating}</p>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Created {new Date(listing.created_at).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/seller/listings/${listing.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


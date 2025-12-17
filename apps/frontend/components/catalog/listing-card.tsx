'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { CatalogListing } from '@/types/catalog';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: CatalogListing;
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
    <Link
      href={`/catalog/${listing.id}`}
      className={cn(
        'group block bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Verified</span>
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
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

        {/* CTA */}
        <div className="pt-2">
          <span className="text-sm font-medium text-primary group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

'use client';

import { Shield, DollarSign, TrendingUp, Calendar, Star } from 'lucide-react';
import { ListingDetail } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface ListingDetailHeaderProps {
  listing: ListingDetail;
}

export function ListingDetailHeader({ listing }: ListingDetailHeaderProps) {
  const { isAuthenticated, user } = useAuth();

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
    })}/month`;
  };

  const canPurchase =
    isAuthenticated &&
    user?.role === 'buyer' &&
    listing.state === 'approved';

  return (
    <div className="space-y-6">
      {/* Title and Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Verified by Escrow</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
            {listing.category}
          </span>
          <span className="px-3 py-1 text-sm font-medium bg-muted text-muted-foreground rounded-full">
            {listing.platform}
          </span>
        </div>
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Price</span>
          </div>
          <p className="text-4xl font-bold text-primary">
            {formatPrice(listing.price_usd)}
          </p>
        </div>
        {canPurchase ? (
          <Button size="lg" asChild>
            <Link href={`/transactions/new?listing_id=${listing.id}`}>
              Buy Now
            </Link>
          </Button>
        ) : listing.state === 'approved' ? (
          <Button size="lg" variant="outline" asChild>
            <Link href={`/login?redirect=/catalog/${listing.id}`}>
              Login to Purchase
            </Link>
          </Button>
        ) : (
          <Button size="lg" disabled>
            {listing.state === 'reserved' ? 'Reserved' : 'Sold'}
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
        {listing.monthly_earnings && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Monthly Earnings</span>
            </div>
            <p className="text-lg font-semibold">
              {formatEarnings(listing.monthly_earnings)}
            </p>
          </div>
        )}
        {listing.account_age_months && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span>Account Age</span>
            </div>
            <p className="text-lg font-semibold">
              {listing.account_age_months} months
            </p>
          </div>
        )}
        {listing.rating && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Star className="h-4 w-4" />
              <span>Rating</span>
            </div>
            <p className="text-lg font-semibold">{listing.rating}</p>
          </div>
        )}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <p className="text-lg font-semibold capitalize">{listing.state}</p>
        </div>
      </div>
    </div>
  );
}

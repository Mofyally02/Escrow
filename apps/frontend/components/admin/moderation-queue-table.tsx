'use client';

import Link from 'next/link';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';
import { Button } from '@/components/ui/button';
import { AdminListing } from '@/types/admin';
import { formatPrice } from '@/lib/utils';

interface ModerationQueueTableProps {
  listings: AdminListing[];
  isLoading?: boolean;
}

export function ModerationQueueTable({
  listings,
  isLoading,
}: ModerationQueueTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading listings...</p>
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
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {listings.map((listing) => (
              <tr
                key={listing.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/listings/${listing.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {listing.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {listing.seller?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {listing.category}
                </td>
                <td className="px-6 py-4 text-sm font-semibold">
                  {formatPrice(listing.price_usd)}
                </td>
                <td className="px-6 py-4">
                  <ListingStatusBadge state={listing.state} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(listing.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/listings/${listing.id}`}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

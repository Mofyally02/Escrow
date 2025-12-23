'use client';

import { useParams } from 'next/navigation';
import { useAdminListing } from '@/lib/hooks/useAdminData';
import { ProofGallery } from '@/components/admin/proof-gallery';
import { AdminActionButtons } from '@/components/admin/admin-action-buttons';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export default function AdminListingReviewPage() {
  const params = useParams();
  const listingId = parseInt(params?.id as string);
  const { data: listing, isLoading } = useAdminListing(listingId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Listing not found</p>
          <Button asChild>
            <Link href="/admin/listings">Back to Queue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/admin/listings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Queue
          </Link>
        </Button>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center gap-3">
              <ListingStatusBadge state={listing.state} />
              <span className="text-sm text-muted-foreground">
                Submitted {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

          {/* Listing Details */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold">Listing Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Category
                </label>
                <p className="mt-1">{listing.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Platform
                </label>
                <p className="mt-1">{listing.platform}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Price
                </label>
                <p className="mt-1 font-semibold">{formatPrice(listing.price_usd)}</p>
              </div>
              {listing.monthly_earnings && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Monthly Earnings
                  </label>
                  <p className="mt-1">{formatPrice(listing.monthly_earnings)}</p>
                </div>
              )}
              {listing.account_age_months && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Age
                  </label>
                  <p className="mt-1">{listing.account_age_months} months</p>
                </div>
              )}
              {listing.rating && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Rating
                  </label>
                  <p className="mt-1">{listing.rating}</p>
                </div>
              )}
            </div>

            {listing.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Seller Info */}
            {listing.seller && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller
                </label>
                <p className="mt-1">{listing.seller.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {listing.seller.email}
                </p>
              </div>
            )}
          </div>

          {/* Proof Gallery */}
          {listing.proofs && listing.proofs.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Files</h2>
              <ProofGallery proofs={listing.proofs} />
            </div>
          )}

          {/* Credentials Notice */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Encrypted Credentials</h3>
                <p className="text-sm text-muted-foreground">
                  Account credentials are encrypted with AES-256-GCM and are
                  not visible to admins. They will only be revealed to the buyer
                  once the escrow transaction is completed and the buyer confirms
                  access.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {listing.admin_notes && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.admin_notes}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {listing.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-red-900">
                Rejection Reason
              </h2>
              <p className="text-red-800 whitespace-pre-wrap">
                {listing.rejection_reason}
              </p>
            </div>
          )}

      {/* Action Buttons */}
      {listing.state === 'under_review' && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <AdminActionButtons
            listingId={listing.id}
            currentState={listing.state}
          />
        </div>
      )}
    </div>
  );
}

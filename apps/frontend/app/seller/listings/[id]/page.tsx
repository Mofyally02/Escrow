'use client';

import { useParams } from 'next/navigation';
import { useSellerListing, useSubmitListing, useDeleteListing } from '@/lib/hooks/useSellerListings';
import { ListingStatusBadge } from '@/components/seller/listing-status-badge';
import { Button } from '@/components/ui/button';
import { Shield, Clock, CheckCircle2, XCircle, FileText, Image as ImageIcon, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Safely parse and validate listing ID
  let listingId: number | null = null;
  if (params?.id) {
    const parsed = typeof params.id === 'string' 
      ? parseInt(params.id, 10) 
      : typeof params.id === 'number' 
        ? params.id 
        : null;
    listingId = parsed && !isNaN(parsed) && parsed > 0 ? parsed : null;
  }
  
  // Validate listing ID
  if (!listingId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Invalid listing ID</p>
          <Button asChild>
            <Link href="/seller/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const { data: listing, isLoading } = useSellerListing(listingId);
  const submitListing = useSubmitListing();
  const deleteListing = useDeleteListing();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    if (!listing) return;
    submitListing.mutate(listing.id);
  };

  const handleDelete = () => {
    if (!listing) return;
    deleteListing.mutate(listing.id);
  };

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
            <Link href="/seller/listings">Back to Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = listing.state === 'draft';
  const canSubmit = listing.state === 'draft';
  const canDelete = listing.state === 'draft' || listing.state === 'under_review';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" asChild>
                <Link href="/seller/listings">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold mt-4 mb-2">{listing.title}</h1>
              <div className="flex items-center gap-3">
                <ListingStatusBadge state={listing.state} />
                <span className="text-sm text-muted-foreground">
                  Created {new Date(listing.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" asChild>
                  <Link href={`/seller/listings/${listing.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {canSubmit && (
                <Button onClick={handleSubmit} disabled={submitListing.isPending}>
                  {submitListing.isPending ? (
                    'Submitting...'
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Status Information */}
          {listing.state === 'under_review' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Under Admin Review
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Your listing is being reviewed by our team. This typically
                    takes 24-48 hours. You'll be notified once a decision is
                    made.
                  </p>
                </div>
              </div>
            </div>
          )}

          {listing.state === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Listing Approved!
                  </h3>
                  <p className="text-sm text-green-800">
                    Your listing is now live and visible to buyers in the
                    catalog.
                  </p>
                </div>
              </div>
            </div>
          )}

          {listing.state === 'draft' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Draft Listing
                  </h3>
                  <p className="text-sm text-blue-800">
                    Complete your listing and submit it for review when ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {listing.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Listing Rejected
                  </h3>
                  <p className="text-sm text-red-800 mb-2">
                    {listing.rejection_reason}
                  </p>
                  <p className="text-xs text-red-700">
                    You can edit and resubmit your listing.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <p className="mt-1 font-semibold">
                  ${(listing.price_usd / 100).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              {listing.monthly_earnings && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Monthly Earnings
                  </label>
                  <p className="mt-1">
                    ${(listing.monthly_earnings / 100).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
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
          </div>

          {/* Proof Files */}
          {listing.proofs && listing.proofs.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.proofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="border rounded-lg overflow-hidden group"
                  >
                    <div className="aspect-video bg-muted relative">
                      {proof.file_url && (
                        <img
                          src={proof.file_url}
                          alt={proof.description || proof.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {proof.proof_type}
                        </span>
                      </div>
                      {proof.description && (
                        <p className="text-sm text-muted-foreground">
                          {proof.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete Button */}
          {canDelete && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-destructive">
                Danger Zone
              </h2>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteListing.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Listing
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Listing?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All proof files and credentials will
              be permanently deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


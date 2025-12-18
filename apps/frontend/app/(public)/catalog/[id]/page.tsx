'use client';

import { useParams } from 'next/navigation';
import { Shield, LockKeyhole, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { useListingDetail } from '@/lib/hooks/useCatalog';
import { ListingDetailHeader } from '@/components/catalog/listing-detail-header';
import { Loader2 } from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = parseInt(params?.id as string);

  const { data: listing, isLoading, isError } = useListingDetail(listingId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Listing not found</p>
          <p className="text-muted-foreground">
            This listing may have been removed or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <ListingDetailHeader listing={listing} />

          {/* Description */}
          {listing.description && (
            <section className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </section>
          )}

          {/* Proof Gallery */}
          {listing.proof_count && listing.proof_count > 0 && (
            <section className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Proof Gallery ({listing.proof_count} {listing.proof_count === 1 ? 'file' : 'files'})
              </h2>
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Proof files are available after purchase verification</p>
              </div>
            </section>
          )}

          {/* Trust Section */}
          <section className="bg-gradient-to-br from-primary/10 to-background border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Why Buy This Account?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Admin Verified</h3>
                  <p className="text-sm text-muted-foreground">
                    This listing has been manually reviewed and verified by our
                    team.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Escrow Protected</h3>
                  <p className="text-sm text-muted-foreground">
                    Your payment is held securely until you confirm successful
                    account access.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure Handover</h3>
                  <p className="text-sm text-muted-foreground">
                    Credentials are encrypted and revealed only once after
                    payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

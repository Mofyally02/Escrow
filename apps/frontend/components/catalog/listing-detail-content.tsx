'use client';

import { Shield, Lock, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { ListingDetailHeader } from './listing-detail-header';
import type { CatalogListing } from '@/types/catalog';

interface ListingDetailContentProps {
  listing: CatalogListing;
}

export function ListingDetailContent({ listing }: ListingDetailContentProps) {
  const earningsProof = listing.proofs?.find((p) => p.proof_type === 'earnings');
  const profileProof = listing.proofs?.find((p) => p.proof_type === 'profile');
  const reviewsProof = listing.proofs?.find((p) => p.proof_type === 'reviews');
  const otherProofs = listing.proofs?.filter(
    (p) => !['earnings', 'profile', 'reviews'].includes(p.proof_type)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <ListingDetailHeader listing={listing} />

          {/* Description */}
          {listing.description && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            </section>
          )}

          {/* Proof Gallery */}
          {listing.proofs && listing.proofs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Proof Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earningsProof && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Earnings Proof</span>
                    </div>
                    {earningsProof.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {earningsProof.description}
                      </p>
                    )}
                    <div className="aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        Proof Image
                      </span>
                    </div>
                  </div>
                )}

                {profileProof && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Profile Proof</span>
                    </div>
                    {profileProof.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {profileProof.description}
                      </p>
                    )}
                    <div className="aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        Proof Image
                      </span>
                    </div>
                  </div>
                )}

                {reviewsProof && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">Reviews Proof</span>
                    </div>
                    {reviewsProof.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {reviewsProof.description}
                      </p>
                    )}
                    <div className="aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        Proof Image
                      </span>
                    </div>
                  </div>
                )}

                {otherProofs?.map((proof) => (
                  <div key={proof.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium capitalize">
                        {proof.proof_type} Proof
                      </span>
                    </div>
                    {proof.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {proof.description}
                      </p>
                    )}
                    <div className="aspect-video bg-muted rounded flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        Proof Image
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trust Section */}
          <section className="bg-muted/50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Why Buy on ESCROW?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Admin Verified</h3>
                  <p className="text-sm text-muted-foreground">
                    Every listing is manually reviewed by our team before
                    approval
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Escrow Protected</h3>
                  <p className="text-sm text-muted-foreground">
                    Funds held securely until you confirm successful account
                    access
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Secure Handover</h3>
                  <p className="text-sm text-muted-foreground">
                    Encrypted credentials revealed only once after payment
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seller Info */}
          {listing.seller && (
            <section className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Seller Information</h3>
              <p className="text-sm text-muted-foreground">
                Verified seller: {listing.seller.full_name}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


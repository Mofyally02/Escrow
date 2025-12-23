'use client';

import { useParams } from 'next/navigation';
import { useSellerListing } from '@/lib/hooks/useSellerListings';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ListingSuccessPage() {
  const params = useParams();
  
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-8 text-center space-y-6">
        <div className="rounded-full bg-green-100 p-4 w-20 h-20 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Listing Submitted!</h1>
          <p className="text-lg text-muted-foreground">
            Your listing has been successfully created and is now under review.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="font-semibold mb-1">What Happens Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                <li>Our admin team will review your listing (typically 24-48 hours)</li>
                <li>We'll verify account ownership and proof files</li>
                <li>You'll receive an email notification once reviewed</li>
                <li>If approved, your listing will go live in the catalog</li>
              </ul>
            </div>
          </div>
        </div>

        {listing && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Listing ID:</p>
            <p className="font-mono text-sm">{listing.id}</p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/seller/listings">View All Listings</Link>
          </Button>
          {listing && (
            <Button asChild>
              <Link href={`/seller/listings/${listing.id}`}>
                View Listing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


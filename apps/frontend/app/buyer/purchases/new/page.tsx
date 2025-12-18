'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useListingDetail } from '@/lib/hooks/useCatalog';
import { useInitiatePurchase } from '@/lib/hooks/useBuyerTransactions';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPurchasePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = parseInt(searchParams.get('listing_id') || '0');
  const { data: listing, isLoading: listingLoading } = useListingDetail(listingId);
  const initiatePurchase = useInitiatePurchase();

  useEffect(() => {
    if (!listingId || isNaN(listingId)) {
      toast.error('Invalid listing ID');
      router.push('/catalog');
    }
  }, [listingId, router]);

  const handlePurchase = () => {
    if (!listingId) return;

    initiatePurchase.mutate({ listing_id: listingId });
  };

  if (listingLoading) {
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
            <Link href="/catalog">Back to Catalog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild>
            <Link href={`/catalog/${listingId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listing
            </Link>
          </Button>

          {/* Order Summary */}
          <div className="bg-card border rounded-lg p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Confirm Purchase</h1>
              <p className="text-muted-foreground">
                Review your order before proceeding to payment
              </p>
            </div>

            {/* Listing Details */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-2">{listing.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{listing.category}</span>
                  <span>•</span>
                  <span>{listing.platform}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(listing.price_usd)}
                </span>
              </div>
            </div>

            {/* Trust Section */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Escrow Protected Purchase</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Funds held securely until you confirm access</li>
                    <li>Credentials encrypted and revealed only once</li>
                    <li>Digital contract legally binding</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={handlePurchase}
              disabled={initiatePurchase.isPending}
              size="lg"
              className="w-full"
            >
              {initiatePurchase.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initiating Purchase...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


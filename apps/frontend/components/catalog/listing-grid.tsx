'use client';

import { useEffect, useRef, useMemo } from 'react';
import { ListingCard } from './listing-card';
import { CatalogListing } from '@/types/catalog';
import { Loader2 } from 'lucide-react';

interface ListingGridProps {
  listings: CatalogListing[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function ListingGrid({
  listings,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ListingGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  // Memoize listings to prevent unnecessary re-renders
  const memoizedListings = useMemo(() => listings, [listings]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memoizedListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more listings...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

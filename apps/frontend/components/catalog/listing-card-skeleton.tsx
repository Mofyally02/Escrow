export function ListingCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}


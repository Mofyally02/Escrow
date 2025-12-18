'use client';

import { useState } from 'react';
import { useAdminListings } from '@/lib/hooks/useAdminData';
import { ModerationQueueTable } from '@/components/admin/moderation-queue-table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ListingState } from '@/types/listing';

export default function AdminListingsPage() {
  const [filter, setFilter] = useState<ListingState | 'all'>('all');
  const { data: listings, isLoading } = useAdminListings(
    filter !== 'all' ? { state: filter } : undefined
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Moderation Queue</h1>
          <p className="text-muted-foreground">
            Review and moderate seller listings
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'under_review' ? 'default' : 'outline'}
            onClick={() => setFilter('under_review')}
          >
            Under Review
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
          >
            Draft
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
        </div>

        {/* Table */}
        <ModerationQueueTable
          listings={listings || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

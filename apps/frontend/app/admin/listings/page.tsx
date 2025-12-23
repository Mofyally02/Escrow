'use client';

import { useState } from 'react';
import { useAdminListings } from '@/lib/hooks/useAdminData';
import { ModerationQueueTable } from '@/components/admin/moderation-queue-table';
import { ModerationQueueGrid } from '@/components/admin/moderation-queue-grid';
import { ViewToggle } from '@/components/admin/view-toggle';
import { Button } from '@/components/ui/button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { Loader2 } from 'lucide-react';
import { ListingState } from '@/types/listing';

type ViewMode = 'grid' | 'list';

export default function AdminListingsPage() {
  // Default to showing UNDER_REVIEW listings (pending approval)
  const [filter, setFilter] = useState<ListingState | 'all'>('under_review');
  const [view, setView] = useState<ViewMode>('grid');
  const { data: listings, isLoading } = useAdminListings(
    filter !== 'all' ? { state: filter } : undefined
  );

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Moderation Queue</h1>
            <p className="text-muted-foreground">
              Review and moderate seller listings
            </p>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <InteractiveButton
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            immediateFeedback={true}
          >
            All
          </InteractiveButton>
          <InteractiveButton
            variant={filter === 'under_review' ? 'default' : 'outline'}
            onClick={() => setFilter('under_review')}
            immediateFeedback={true}
          >
            Under Review
          </InteractiveButton>
          <InteractiveButton
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
            immediateFeedback={true}
          >
            Draft
          </InteractiveButton>
          <InteractiveButton
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            immediateFeedback={true}
          >
            Approved
          </InteractiveButton>
        </div>

        {/* Content - Grid or List View */}
        {view === 'grid' ? (
          <ModerationQueueGrid
            listings={listings || []}
            isLoading={isLoading}
          />
        ) : (
          <ModerationQueueTable
            listings={listings || []}
            isLoading={isLoading}
          />
        )}
    </>
  );
}

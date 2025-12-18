'use client';

import { useState } from 'react';
import { Grid3x3, List, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'earnings-high';

interface CatalogToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount?: number;
  className?: string;
}

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  price-low: 'Price: Low to High',
  price-high: 'Price: High to Low',
  earnings-high: 'Highest Earnings',
};

export function CatalogToolbar({
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  resultCount,
  className,
}: CatalogToolbarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  return (
    <div className={cn('flex items-center justify-between flex-wrap gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {resultCount !== undefined ? `${resultCount} listings` : 'Loading...'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort Dropdown - Simple select for now */}
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-background border rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="earnings-high">Highest Earnings</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { CatalogFilters } from '@/types/catalog';
import { cn } from '@/lib/utils';

interface FiltersSidebarProps {
  filters: CatalogFilters;
  onFiltersChange: (filters: CatalogFilters) => void;
  onClose?: () => void;
  className?: string;
}

const PLATFORMS = ['Upwork', 'Fiverr', 'Freelancer', 'PeoplePerHour', 'Other'];
const CATEGORIES = [
  'Academic',
  'Article',
  'Translation',
  'Transcription',
  'Data Entry',
  'Other',
];

export function FiltersSidebar({
  filters,
  onFiltersChange,
  onClose,
  className,
}: FiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<CatalogFilters>(filters);

  const updateFilter = (key: keyof CatalogFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters: CatalogFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== null && v !== ''
  );

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-6 space-y-6 h-fit',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <select
          value={localFilters.category || ''}
          onChange={(e) =>
            updateFilter('category', e.target.value || undefined)
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Platform Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Platform</label>
        <select
          value={localFilters.platform || ''}
          onChange={(e) =>
            updateFilter('platform', e.target.value || undefined)
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.min_price || ''}
            onChange={(e) =>
              updateFilter(
                'min_price',
                e.target.value ? parseInt(e.target.value) * 100 : undefined
              )
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.max_price || ''}
            onChange={(e) =>
              updateFilter(
                'max_price',
                e.target.value ? parseInt(e.target.value) * 100 : undefined
              )
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Prices in USD (cents)
        </p>
      </div>

      {/* Monthly Earnings Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Monthly Earnings
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.min_earnings || ''}
            onChange={(e) =>
              updateFilter(
                'min_earnings',
                e.target.value ? parseInt(e.target.value) * 100 : undefined
              )
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.max_earnings || ''}
            onChange={(e) =>
              updateFilter(
                'max_earnings',
                e.target.value ? parseInt(e.target.value) * 100 : undefined
              )
            }
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <select
          value={localFilters.sort_by || 'newest'}
          onChange={(e) =>
            updateFilter('sort_by', e.target.value as CatalogFilters['sort_by'])
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="earnings_high">Highest Earnings</option>
        </select>
      </div>
    </div>
  );
}

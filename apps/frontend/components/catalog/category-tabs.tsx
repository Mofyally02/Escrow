'use client';

import { CatalogFilters } from '@/types/catalog';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Article', label: 'Article' },
  { value: 'Translation', label: 'Translation' },
  { value: 'Transcription', label: 'Transcription' },
  { value: 'Data Entry', label: 'Data Entry' },
  { value: 'Other', label: 'Other' },
];

interface CategoryTabsProps {
  activeCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  className?: string;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  className,
}: CategoryTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-hide',
        className
      )}
    >
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() =>
            onCategoryChange(category.value ? category.value : undefined)
          }
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
            activeCategory === category.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}

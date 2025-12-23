'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-background border border-border p-1',
        className
      )}
    >
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          'flex items-center justify-center rounded-md px-3 py-2 transition-all duration-200',
          view === 'grid'
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          'flex items-center justify-center rounded-md px-3 py-2 transition-all duration-200',
          view === 'list'
            ? 'bg-green-600 text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}


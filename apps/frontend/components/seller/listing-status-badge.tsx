'use client';

import { Clock, CheckCircle2, XCircle, ShoppingBag, FileText } from 'lucide-react';
import { ListingState } from '@/types/listing';
import { cn } from '@/lib/utils';

interface ListingStatusBadgeProps {
  state: ListingState;
  className?: string;
}

const stateConfig: Record<
  ListingState,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <FileText className="h-3 w-3" />,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  reserved: {
    label: 'Reserved',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <ShoppingBag className="h-3 w-3" />,
  },
  sold: {
    label: 'Sold',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

export function ListingStatusBadge({
  state,
  className,
}: ListingStatusBadgeProps) {
  const config = stateConfig[state];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}


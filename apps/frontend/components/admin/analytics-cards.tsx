'use client';

import { AnalyticsData } from '@/types/admin';
import { formatPrice } from '@/lib/utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';

interface AnalyticsCardsProps {
  data: AnalyticsData;
  isLoading?: boolean;
}

export function AnalyticsCards({ data, isLoading }: AnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Pending Listings
            </p>
            <p className="text-3xl font-bold">{data.pending_listings || 0}</p>
          </div>
          <div className="rounded-full bg-yellow-100 p-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Active Escrows
            </p>
            <p className="text-3xl font-bold">
              {data.active_escrows || 0}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Total Revenue
            </p>
            <p className="text-3xl font-bold">
              {formatPrice(data.total_revenue || 0)}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Dispute Rate
            </p>
            <p className="text-3xl font-bold">
              {((data.dispute_rate || 0) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

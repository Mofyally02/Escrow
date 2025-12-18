'use client';

import { useAdminAnalytics } from '@/lib/hooks/useAdminData';
import { AnalyticsCards } from '@/components/admin/analytics-cards';
import { Loader2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Key performance indicators and platform insights
          </p>
        </div>

        {analytics && <AnalyticsCards data={analytics} />}

        {/* Placeholder for future charts */}
        <div className="mt-8 bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Detailed charts and analytics coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

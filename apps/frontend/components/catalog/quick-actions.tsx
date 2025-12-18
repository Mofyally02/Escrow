'use client';

import { ShoppingBag, Store, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserMode } from '@/hooks/useUserMode';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const { isAuthenticated, user } = useAuth();
  const { mode, canBuy, canSell } = useUserMode();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {mode === 'buyer' && canBuy && (
        <Button variant="outline" size="sm" asChild>
          <Link href="/buyer/purchases">
            <ShoppingBag className="h-4 w-4 mr-2" />
            My Purchases
          </Link>
        </Button>
      )}
      {mode === 'seller' && canSell && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/seller/dashboard">
              <Store className="h-4 w-4 mr-2" />
              My Listings
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/seller/submit">
              <Plus className="h-4 w-4 mr-2" />
              Submit Listing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}


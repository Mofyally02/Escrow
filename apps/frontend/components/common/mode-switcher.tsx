'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserMode } from '@/hooks/useUserMode';

export type UserMode = 'buyer' | 'seller' | 'both';

interface ModeSwitcherProps {
  currentMode?: UserMode;
  onModeChange?: (mode: 'buyer' | 'seller') => void;
  className?: string;
}

export function ModeSwitcher({ currentMode, onModeChange, className }: ModeSwitcherProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, changeMode } = useUserMode();
  
  // All authenticated users can switch between buyer and seller modes
  // The backend will handle permissions based on actual role
  if (!isAuthenticated || !user) {
    return null;
  }

  // Use mode from hook or fallback to currentMode prop
  const activeMode = currentMode === 'both' ? mode : (currentMode as 'buyer' | 'seller' || mode);

  const handleModeChange = (newMode: 'buyer' | 'seller') => {
    changeMode(newMode);
    onModeChange?.(newMode);
    
    // Navigate to the appropriate route
    if (newMode === 'buyer') {
      // If on seller routes, navigate to buyer dashboard
      if (pathname?.startsWith('/seller')) {
        router.push('/buyer/dashboard');
      } else {
        // If on catalog or buyer routes, stay there
        if (!pathname?.startsWith('/buyer') && !pathname?.startsWith('/catalog')) {
          router.push('/buyer/dashboard');
        }
      }
    } else if (newMode === 'seller') {
      // If on buyer routes, navigate to seller dashboard
      if (pathname?.startsWith('/buyer') || pathname?.startsWith('/catalog')) {
        router.push('/seller/dashboard');
      } else {
        // If on seller routes, stay there
        if (!pathname?.startsWith('/seller')) {
          router.push('/seller/dashboard');
        }
      }
    }
  };

  return (
    <div className={cn('flex items-center gap-2 bg-muted rounded-lg p-1', className)}>
      <Button
        variant={activeMode === 'buyer' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('buyer')}
        className={cn(
          'flex items-center gap-2 flex-1',
          activeMode === 'buyer' && 'shadow-sm'
        )}
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Buying</span>
      </Button>
      <div className="h-6 w-px bg-border" />
      <Button
        variant={activeMode === 'seller' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('seller')}
        className={cn(
          'flex items-center gap-2 flex-1',
          activeMode === 'seller' && 'shadow-sm'
        )}
      >
        <Store className="h-4 w-4" />
        <span className="hidden sm:inline">Selling</span>
      </Button>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Store, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export type UserMode = 'buyer' | 'seller' | 'both';

interface ModeSwitcherProps {
  currentMode: UserMode;
  onModeChange: (mode: 'buyer' | 'seller') => void;
  className?: string;
}

export function ModeSwitcher({ currentMode, onModeChange, className }: ModeSwitcherProps) {
  const { user, isAuthenticated } = useAuth();
  
  // All authenticated users can switch between buyer and seller modes
  // The backend will handle permissions based on actual role
  if (!isAuthenticated || !user) {
    return null;
  }

  const [activeMode, setActiveMode] = useState<'buyer' | 'seller'>(
    currentMode === 'both' ? 'buyer' : (currentMode as 'buyer' | 'seller')
  );

  useEffect(() => {
    if (currentMode !== 'both') {
      setActiveMode(currentMode as 'buyer' | 'seller');
    }
  }, [currentMode]);

  const handleModeChange = (mode: 'buyer' | 'seller') => {
    setActiveMode(mode);
    onModeChange(mode);
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


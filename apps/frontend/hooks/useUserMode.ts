'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

export type UserMode = 'buyer' | 'seller';

const MODE_STORAGE_KEY = 'escrow_user_mode';

export function useUserMode() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mode, setMode] = useState<UserMode>('buyer');

  // All authenticated users can access both buyer and seller features
  // Backend will enforce permissions based on actual role
  const canBuy = !!user; // All authenticated users can buy
  const canSell = !!user; // All authenticated users can sell (backend will check permissions)
  const hasBothModes = !!user; // All authenticated users can switch modes

  // Detect mode from current route
  useEffect(() => {
    if (!user) {
      setMode('buyer');
      return;
    }

    // Detect mode from current route
    if (pathname?.startsWith('/seller')) {
      setMode('seller');
      localStorage.setItem(MODE_STORAGE_KEY, 'seller');
    } else if (pathname?.startsWith('/buyer') || pathname?.startsWith('/catalog')) {
      setMode('buyer');
      localStorage.setItem(MODE_STORAGE_KEY, 'buyer');
    } else {
      // If not on a specific route, check storage or default
      const stored = localStorage.getItem(MODE_STORAGE_KEY);
      if (stored === 'buyer' || stored === 'seller') {
        setMode(stored as UserMode);
      } else {
        setMode('buyer'); // Default
      }
    }
  }, [user, pathname]);

  const changeMode = (newMode: UserMode) => {
    if (!hasBothModes) return; // Can't change if only one mode available
    setMode(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  };

  return {
    mode,
    changeMode,
    canBuy,
    canSell,
    hasBothModes,
  };
}


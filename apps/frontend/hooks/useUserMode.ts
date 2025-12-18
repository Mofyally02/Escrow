'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserMode = 'buyer' | 'seller';

const MODE_STORAGE_KEY = 'escrow_user_mode';

export function useUserMode() {
  const { user } = useAuth();
  const [mode, setMode] = useState<UserMode>('buyer');

  // All authenticated users can access both buyer and seller features
  // Backend will enforce permissions based on actual role
  const canBuy = !!user; // All authenticated users can buy
  const canSell = !!user; // All authenticated users can sell (backend will check permissions)
  const hasBothModes = !!user; // All authenticated users can switch modes

  // Initialize mode from storage or default based on role
  useEffect(() => {
    if (!user) {
      setMode('buyer');
      return;
    }

    // If user can only do one thing, set that mode
    if (canBuy && !canSell) {
      setMode('buyer');
      return;
    }
    if (canSell && !canBuy) {
      setMode('seller');
      return;
    }

    // If user can do both, check storage or default to buyer
    if (hasBothModes) {
      const stored = localStorage.getItem(MODE_STORAGE_KEY);
      if (stored === 'buyer' || stored === 'seller') {
        setMode(stored as UserMode);
      } else {
        setMode('buyer'); // Default
      }
    }
  }, [user, canBuy, canSell, hasBothModes]);

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


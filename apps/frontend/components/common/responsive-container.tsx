'use client';

import { useResponsiveResize } from '@/lib/hooks/useResponsiveResize';
import { useResponsiveScroll } from '@/lib/hooks/useResponsiveScroll';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  onScroll?: (scrollY: number) => void;
  onResize?: (width: number, height: number) => void;
}

/**
 * Container component with responsive scroll and resize handling
 * Optimizes performance with throttled events
 */
export function ResponsiveContainer({
  children,
  className,
  onScroll,
  onResize,
}: ResponsiveContainerProps) {
  const { width, height } = useResponsiveResize({
    onResize,
    throttleMs: 150,
  });

  const { scrollY } = useResponsiveScroll({
    onScroll,
    throttleMs: 100,
  });

  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}


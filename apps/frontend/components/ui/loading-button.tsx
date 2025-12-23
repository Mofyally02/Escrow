'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Optimized button component with loading state and immediate visual feedback
 * Provides instant UI updates for better perceived performance
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn('relative', className)}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin absolute left-3" />
        )}
        <span className={cn(isLoading && 'ml-6')}>
          {isLoading ? loadingText || 'Loading...' : children}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';


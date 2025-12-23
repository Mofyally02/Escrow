'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { forwardRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface InteractiveButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  immediateFeedback?: boolean; // Show loading state immediately
  children: React.ReactNode;
}

/**
 * Interactive button with immediate visual feedback
 * Optimized for perceived performance and responsiveness
 */
export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  (
    {
      isLoading,
      loadingText,
      immediateFeedback = true,
      children,
      disabled,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (immediateFeedback && !isLoading) {
          setIsPressed(true);
          // Reset after animation
          setTimeout(() => setIsPressed(false), 150);
        }
        onClick?.(e);
      },
      [onClick, immediateFeedback, isLoading]
    );

    const isDisabled = disabled || isLoading;

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'relative transition-all duration-150',
          isPressed && 'scale-95',
          isDisabled && 'cursor-not-allowed opacity-60',
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        <span>{isLoading ? loadingText || 'Loading...' : children}</span>
      </Button>
    );
  }
);

InteractiveButton.displayName = 'InteractiveButton';


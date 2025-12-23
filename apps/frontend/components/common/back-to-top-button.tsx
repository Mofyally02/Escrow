'use client';

import { useState, useEffect } from 'react';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { ArrowUp } from 'lucide-react';
import { useResponsiveScroll } from '@/lib/hooks/useResponsiveScroll';
import { cn } from '@/lib/utils';

interface BackToTopButtonProps {
  threshold?: number; // Show button after scrolling this many pixels
  className?: string;
}

export function BackToTopButton({ threshold = 400, className }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  const { scrollY } = useResponsiveScroll({
    onScroll: (y) => {
      setIsVisible(y > threshold);
    },
    throttleMs: 100,
  });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <InteractiveButton
      onClick={scrollToTop}
      immediateFeedback={true}
      size="icon"
      className={cn(
        'fixed bottom-8 right-8 z-50 rounded-full shadow-lg',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        className
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </InteractiveButton>
  );
}


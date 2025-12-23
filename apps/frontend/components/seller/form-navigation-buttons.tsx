'use client';

import { InteractiveButton } from '@/components/ui/interactive-button';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface FormNavigationButtonsProps {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  canProceed?: boolean;
  isLoading?: boolean;
  showNext?: boolean;
  showBack?: boolean;
}

export function FormNavigationButtons({
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  canProceed = true,
  isLoading = false,
  showNext = true,
  showBack = true,
}: FormNavigationButtonsProps) {
  return (
    <div className="flex justify-between pt-4">
      {showBack && onBack && (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backLabel}
        </Button>
      )}
      {showNext && onNext && (
        <InteractiveButton
          onClick={onNext}
          disabled={!canProceed || isLoading}
          immediateFeedback={true}
          className="ml-auto"
        >
          {nextLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </InteractiveButton>
      )}
    </div>
  );
}


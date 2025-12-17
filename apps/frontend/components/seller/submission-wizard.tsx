'use client';

import { ReactNode } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface SubmissionWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function SubmissionWizard({
  steps,
  currentStep,
  onStepChange,
  className,
}: SubmissionWizardProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => onStepChange?.(index)}
                  disabled={!onStepChange || isUpcoming}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent &&
                      'bg-primary/10 border-primary text-primary',
                    isUpcoming &&
                      'bg-background border-muted text-muted-foreground cursor-not-allowed',
                    !isUpcoming && onStepChange && 'cursor-pointer hover:border-primary/50'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


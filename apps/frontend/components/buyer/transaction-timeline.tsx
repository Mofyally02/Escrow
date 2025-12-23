'use client';

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { TransactionState } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionTimelineProps {
  currentState: TransactionState;
  className?: string;
}

// Map states to step numbers for ordering
const stateToStep: Record<TransactionState, number> = {
  // STEP 1
  purchase_initiated: 1,
  pending: 1, // Legacy
  payment_pending: 1,
  // STEP 2
  funds_held: 2,
  // STEP 3
  temporary_access_granted: 3,
  // STEP 4
  verification_window: 4,
  // STEP 5
  ownership_agreement_pending: 5,
  ownership_agreement_signed: 5,
  contract_signed: 5, // Legacy
  // STEP 6
  funds_release_pending: 6,
  funds_released: 6,
  credentials_released: 6, // Legacy
  // STEP 7
  completed: 7,
  // Terminal states
  refunded: 0,
  disputed: 0,
  cancelled: 0,
};

const timelineSteps: Array<{
  step: number;
  states: TransactionState[];
  label: string;
  description: string;
}> = [
  {
    step: 1,
    states: ['purchase_initiated', 'payment_pending', 'pending'],
    label: 'Purchase Initiated',
    description: 'Transaction created, awaiting payment',
  },
  {
    step: 2,
    states: ['funds_held'],
    label: 'Funds Held in Escrow',
    description: 'Payment received and secured',
  },
  {
    step: 3,
    states: ['temporary_access_granted'],
    label: 'Temporary Access Granted',
    description: 'Credentials delivered, ready for verification',
  },
  {
    step: 4,
    states: ['verification_window'],
    label: 'Verification Window',
    description: 'Verify account access (24-48 hours)',
  },
  {
    step: 5,
    states: [
      'ownership_agreement_pending',
      'ownership_agreement_signed',
      'contract_signed',
    ],
    label: 'Ownership Agreement',
    description: 'Sign ownership transfer agreement',
  },
  {
    step: 6,
    states: ['funds_release_pending', 'funds_released', 'credentials_released'],
    label: 'Funds Release',
    description: 'Confirm access and release payment',
  },
  {
    step: 7,
    states: ['completed'],
    label: 'Transaction Completed',
    description: 'Payment released to seller',
  },
];

export function TransactionTimeline({
  currentState,
  className,
}: TransactionTimelineProps) {
  const currentStep = stateToStep[currentState] || 0;

  // Get the step index for the current state
  const getStepIndex = (step: number) => {
    return timelineSteps.findIndex((s) => s.step === step);
  };

  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold mb-4">Transaction Progress</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Steps */}
        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const isInStep = step.states.includes(currentState);

            return (
              <div key={step.step} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    (isCurrent || isInStep) &&
                      'bg-primary/10 border-primary text-primary animate-pulse',
                    isPending && 'bg-background border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent || isInStep ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div
                    className={cn(
                      'font-semibold mb-1',
                      isCompleted || isCurrent || isInStep
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      'text-sm',
                      isCompleted || isCurrent || isInStep
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/70'
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

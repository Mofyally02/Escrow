'use client';

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { TransactionState } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TransactionTimelineProps {
  currentState: TransactionState;
  className?: string;
}

const timelineSteps: Array<{
  state: TransactionState;
  label: string;
  description: string;
}> = [
  {
    state: 'pending',
    label: 'Payment Initiated',
    description: 'Purchase started, awaiting payment',
  },
  {
    state: 'funds_held',
    label: 'Funds Held in Escrow',
    description: 'Payment received and secured',
  },
  {
    state: 'contract_signed',
    label: 'Contract Signed',
    description: 'Digital contract executed',
  },
  {
    state: 'credentials_released',
    label: 'Credentials Revealed',
    description: 'Account details provided',
  },
  {
    state: 'completed',
    label: 'Transaction Completed',
    description: 'Payment released to seller',
  },
];

const stateOrder: TransactionState[] = [
  'pending',
  'funds_held',
  'contract_signed',
  'credentials_released',
  'completed',
];

export function TransactionTimeline({
  currentState,
  className,
}: TransactionTimelineProps) {
  const currentIndex = stateOrder.indexOf(currentState);

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold mb-4">Transaction Progress</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Steps */}
        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const stepIndex = stateOrder.indexOf(step.state);
            const isCompleted = stepIndex < currentIndex;
            const isCurrent = stepIndex === currentIndex;
            const isPending = stepIndex > currentIndex;

            return (
              <div key={step.state} className="relative flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground',
                    isCurrent &&
                      'bg-primary/10 border-primary text-primary animate-pulse',
                    isPending && 'bg-background border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
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
                      isCompleted || isCurrent
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      'text-sm',
                      isCompleted || isCurrent
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


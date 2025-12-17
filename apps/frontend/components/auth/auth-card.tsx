import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  children: ReactNode;
  title: string;
  description?: string;
  step?: { current: number; total: number };
  className?: string;
}

export function AuthCard({
  children,
  title,
  description,
  step,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full bg-card border rounded-lg shadow-lg p-8 space-y-6',
        className
      )}
    >
      {/* Progress indicator */}
      {step && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>
            Step {step.current} of {step.total}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: step.total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 w-8 rounded-full transition-colors',
                  i < step.current
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}


'use client';

import { LoadingButton } from '@/components/ui/loading-button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { useButtonState } from '@/lib/hooks/useButtonState';
import { cn } from '@/lib/utils';

interface ActionButton {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Group of action buttons with consistent loading states and feedback
 */
export function ActionButtonGroup({
  actions,
  className,
  orientation = 'horizontal',
}: ActionButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {actions.map((action, index) => {
        const ButtonComponent = action.isLoading
          ? LoadingButton
          : InteractiveButton;

        return (
          <ButtonComponent
            key={index}
            onClick={action.onClick}
            variant={action.variant || 'default'}
            disabled={action.disabled}
            isLoading={action.isLoading}
            immediateFeedback={!action.isLoading}
            className="flex-1 min-w-[120px]"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </ButtonComponent>
        );
      })}
    </div>
  );
}


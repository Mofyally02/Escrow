'use client';

import { useState } from 'react';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { useOptimisticMutation } from '@/lib/hooks/useOptimisticMutation';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface OptimisticListItemProps {
  id: number;
  title: string;
  onDelete?: (id: number) => void;
}

/**
 * Example component showing optimistic updates
 * Updates UI immediately, rolls back on error
 */
export function OptimisticListItem({ id, title, onDelete }: OptimisticListItemProps) {
  const queryClient = useQueryClient();
  const [isDeleted, setIsDeleted] = useState(false);

  const deleteMutation = useOptimisticMutation({
    mutationFn: async (itemId: number) => {
      return await apiClient.delete(`/items/${itemId}`);
    },
    successMessage: 'Item deleted successfully',
    errorMessage: 'Failed to delete item',
    invalidateQueries: ['items'],
    optimisticUpdate: (itemId) => {
      // Immediately remove from UI
      setIsDeleted(true);
      queryClient.setQueryData(['items'], (old: any[]) =>
        old?.filter((item) => item.id !== itemId) || []
      );
    },
    rollback: (context) => {
      // Rollback on error
      setIsDeleted(false);
      if (context && 'previousData' in context) {
        (context.previousData as Array<{ queryKey: string[]; data: unknown }>).forEach(
          ({ queryKey, data }) => {
            queryClient.setQueryData(queryKey, data);
          }
        );
      }
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(id);
    onDelete?.(id);
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg animate-fade-in">
      <span>{title}</span>
      <InteractiveButton
        isLoading={deleteMutation.isPending}
        immediateFeedback={true}
        onClick={handleDelete}
        variant="destructive"
        size="sm"
      >
        Delete
      </InteractiveButton>
    </div>
  );
}


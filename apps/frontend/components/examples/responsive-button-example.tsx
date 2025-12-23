/**
 * Example implementation of responsive buttons with real-time feedback
 * Use these patterns throughout the application
 */
'use client';

import { useState } from 'react';
import { LoadingButton } from '@/components/ui/loading-button';
import { InteractiveButton } from '@/components/ui/interactive-button';
import { Button } from '@/components/ui/button';
import { useButtonState } from '@/lib/hooks/useButtonState';
import { useImmediateFeedback } from '@/lib/hooks/useImmediateFeedback';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils/responsive';

// Example 1: Simple loading button
export function SimpleLoadingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Action completed!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingButton
      isLoading={isLoading}
      loadingText="Processing..."
      onClick={handleClick}
    >
      Submit
    </LoadingButton>
  );
}

// Example 2: Button with state management
export function StateManagedButton() {
  const {
    state,
    isLoading,
    isSuccess,
    isError,
    setLoading,
    setSuccess,
    setError,
  } = useButtonState({
    onSuccess: () => toast.success('Success!'),
    onError: (error) => toast.error(error.message),
    timeout: 3000,
  });

  const handleClick = async () => {
    setLoading();
    try {
      await apiClient.post('/endpoint');
      setSuccess();
    } catch (error: any) {
      setError(error);
    }
  };

  return (
    <InteractiveButton
      isLoading={isLoading}
      immediateFeedback={true}
      onClick={handleClick}
      variant={isSuccess ? 'default' : isError ? 'destructive' : 'default'}
    >
      {isSuccess ? 'Success!' : isError ? 'Error - Try Again' : 'Click Me'}
    </InteractiveButton>
  );
}

// Example 3: Mutation with immediate feedback
export function MutationButton() {
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiClient.post('/endpoint', data);
    },
    onSuccess: () => {
      toast.success('Saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save');
    },
  });

  return (
    <LoadingButton
      isLoading={mutation.isPending}
      loadingText="Saving..."
      onClick={() => mutation.mutate({})}
      disabled={mutation.isPending}
    >
      Save Changes
    </LoadingButton>
  );
}

// Example 4: Debounced search button
export function DebouncedSearchButton() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = debounce(async (searchQuery: string) => {
    setIsSearching(true);
    try {
      await apiClient.get(`/search?q=${searchQuery}`);
      setIsSearching(false);
    } catch (error) {
      setIsSearching(false);
    }
  }, 300);

  const handleSearch = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="flex-1 px-4 py-2 border rounded-md"
        placeholder="Search..."
      />
      <LoadingButton isLoading={isSearching} loadingText="Searching...">
        Search
      </LoadingButton>
    </div>
  );
}

// Example 5: Form submission with immediate feedback
export function FormSubmitButton() {
  const {
    isProcessing,
    hasError,
    hasSuccess,
    startProcessing,
    handleSuccess,
    handleError,
  } = useImmediateFeedback({
    onSuccess: () => toast.success('Form submitted!'),
    onError: () => toast.error('Submission failed'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startProcessing();
    try {
      await apiClient.post('/submit', {});
      handleSuccess();
    } catch (error) {
      handleError();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InteractiveButton
        isLoading={isProcessing}
        immediateFeedback={true}
        type="submit"
        variant={hasSuccess ? 'default' : hasError ? 'destructive' : 'default'}
      >
        {hasSuccess ? 'Submitted!' : hasError ? 'Failed - Try Again' : 'Submit Form'}
      </InteractiveButton>
    </form>
  );
}

// Example 6: Multiple actions with state
export function MultiActionButtons() {
  const approveState = useButtonState();
  const rejectState = useButtonState();

  const handleApprove = async () => {
    approveState.setLoading();
    try {
      await apiClient.post('/approve');
      approveState.setSuccess();
    } catch (error: any) {
      approveState.setError(error);
    }
  };

  const handleReject = async () => {
    rejectState.setLoading();
    try {
      await apiClient.post('/reject');
      rejectState.setSuccess();
    } catch (error: any) {
      rejectState.setError(error);
    }
  };

  return (
    <div className="flex gap-2">
      <LoadingButton
        isLoading={approveState.isLoading}
        loadingText="Approving..."
        onClick={handleApprove}
        variant={approveState.isSuccess ? 'default' : 'default'}
      >
        {approveState.isSuccess ? 'Approved!' : 'Approve'}
      </LoadingButton>
      <LoadingButton
        isLoading={rejectState.isLoading}
        loadingText="Rejecting..."
        onClick={handleReject}
        variant={rejectState.isSuccess ? 'destructive' : 'destructive'}
      >
        {rejectState.isSuccess ? 'Rejected!' : 'Reject'}
      </LoadingButton>
    </div>
  );
}


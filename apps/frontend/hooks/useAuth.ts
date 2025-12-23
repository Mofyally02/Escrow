'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { create } from 'zustand';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin';
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
}

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

// Zustand store for auth state (access token in memory only)
const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAuth: () => set({ accessToken: null }),
}));

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, setAccessToken, clearAuth } = useAuthStore();

  // Check if token exists in localStorage
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  // Get current user - only fetch if token exists
  const { data: user, isLoading, error } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    },
    retry: false,
    staleTime: 0, // Always refetch when invalidated (changed from 5 minutes to ensure fresh data after login)
    enabled: hasToken, // Only fetch if token exists
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true, // Refetch on mount to get fresh user data (changed from false)
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout fails, clear local state
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user: user || null,
    isAuthenticated: !!user && !error,
    isLoading,
    logout: () => logoutMutation.mutate(),
    accessToken,
    setAccessToken,
  };
}


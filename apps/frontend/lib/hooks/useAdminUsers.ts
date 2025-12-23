'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { AdminUser } from '@/types/admin';

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async () => {
      const response = await apiClient.get<AdminUser[]>('/admin/users');
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useVerifyUserEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post<AdminUser>(
        `/admin/users/${userId}/verify-email`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`Email verified for ${data.email}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to verify email';
      toast.error(message);
    },
  });
}

export function useVerifyUserPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post<AdminUser>(
        `/admin/users/${userId}/verify-phone`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`Phone verified for ${data.email}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to verify phone';
      toast.error(message);
    },
  });
}

export function useVerifyUserBoth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post<AdminUser>(
        `/admin/users/${userId}/verify-both`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`Email and phone verified for ${data.email}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to verify user';
      toast.error(message);
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
      notes,
    }: {
      userId: number;
      reason: string;
      notes?: string;
    }) => {
      const response = await apiClient.post<AdminUser>(
        `/admin/users/${userId}/suspend`,
        { reason, notes }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`Account suspended for ${data.email}. Email notification sent.`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to suspend account';
      toast.error(message);
    },
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post<AdminUser>(
        `/admin/users/${userId}/unsuspend`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success(`Account unsuspended for ${data.email}`);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to unsuspend account';
      toast.error(message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: number;
      reason: string;
    }) => {
      await apiClient.delete(`/admin/users/${userId}`, {
        data: { reason, confirm: true },
      });
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      toast.success('User account deleted successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Failed to delete account';
      toast.error(message);
    },
  });
}


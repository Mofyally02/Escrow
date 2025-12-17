'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Notification } from '@/components/notifications/notification-center';

// In-memory notification store (replace with backend API in production)
const notificationStore: Notification[] = [];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Load notifications from store
    setNotifications([...notificationStore]);
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        read: false,
      };

      notificationStore.unshift(newNotification);
      setNotifications([...notificationStore]);

      // Show toast
      toast[notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'](
        notification.title,
        {
          description: notification.message,
        }
      );
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    const index = notificationStore.findIndex((n) => n.id === id);
    if (index !== -1) {
      notificationStore[index].read = true;
      setNotifications([...notificationStore]);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationStore.forEach((n) => {
      n.read = true;
    });
    setNotifications([...notificationStore]);
  }, []);

  const clear = useCallback((id: string) => {
    const index = notificationStore.findIndex((n) => n.id === id);
    if (index !== -1) {
      notificationStore.splice(index, 1);
      setNotifications([...notificationStore]);
    }
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clear,
  };
}


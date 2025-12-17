'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { Notification } from '@/components/notifications/notification-center';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    );
  }
  return context;
}


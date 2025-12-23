'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { FeedbackForm } from '@/components/beta/feedback-form';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function AdminHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clear } = useNotifications();
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default: w-64 = 256px

  // Monitor sidebar width changes (optimized with debouncing)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateHeaderPosition = () => {
      const sidebar = document.querySelector('[data-admin-sidebar]');
      if (sidebar) {
        const width = sidebar.clientWidth;
        setSidebarWidth(width);
      }
    };

    // Debounced update function
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateHeaderPosition, 16); // ~60fps
    };

    // Initial check
    updateHeaderPosition();

    // Watch for sidebar width changes (only class changes, not all mutations)
    const observer = new MutationObserver(debouncedUpdate);
    const sidebar = document.querySelector('[data-admin-sidebar]');
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class'],
        childList: false,
        subtree: false,
      });
    }

    // Throttled resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHeaderPosition, 100);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header
      className="fixed top-0 right-0 h-16 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
      style={{ left: `${sidebarWidth}px` }}
    >
      <div className="h-full flex items-center justify-end px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClear={clear}
          />
          <FeedbackForm />
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {user?.role || 'user'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

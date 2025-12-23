'use client';

import { useAuth } from '@/hooks/useAuth';
import { Shield, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { FeedbackForm } from '@/components/beta/feedback-form';
import { useNotifications } from '@/lib/hooks/useNotifications';
import Link from 'next/link';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clear } = useNotifications();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-64 h-16 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full flex items-center px-4 lg:px-6">
          {/* Left: Actions - Notification, Feedback, User, Logout */}
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clear}
            />
            <FeedbackForm />
            <div className="flex items-center space-x-3">
              <div className="text-left">
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
        ) : (
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}


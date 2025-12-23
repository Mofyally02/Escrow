'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  UsersRound,
  BarChart,
  Scale,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Update document attribute for CSS targeting (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const main = document.querySelector('main');
      if (main) {
        if (isCollapsed) {
          main.setAttribute('data-sidebar-collapsed', 'true');
        } else {
          main.removeAttribute('data-sidebar-collapsed');
        }
      }
    }, 50); // Small debounce to batch DOM updates

    return () => clearTimeout(timeoutId);
  }, [isCollapsed]);

  // Admin navigation items
  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/listings',
      label: 'Moderation Queue',
      icon: FileText,
    },
    {
      href: '/admin/transactions',
      label: 'Transactions',
      icon: ShoppingBag,
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: UsersRound,
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart,
    },
    {
      href: '/admin/legal',
      label: 'Legal Documents',
      icon: Scale,
    },
  ];

  return (
    <aside
      data-admin-sidebar
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b px-4">
          {!isCollapsed ? (
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ESCROW</span>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}


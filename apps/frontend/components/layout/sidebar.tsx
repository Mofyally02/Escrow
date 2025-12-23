'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  ShoppingBag, 
  Package, 
  FileText, 
  Shield, 
  CreditCard, 
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Base navigation items (always visible)
  const baseNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/catalog', label: 'Browse Listings', icon: ShoppingBag },
  ];

  // Authenticated user items
  const authenticatedItems = isAuthenticated
    ? [
        { href: '/buyer/dashboard', label: 'My Purchases', icon: Package },
        { href: '/seller/dashboard', label: 'My Listings', icon: FileText },
        { href: '/seller/listings/new', label: 'Submit Listing', icon: FileText },
      ]
    : [];

  // Admin items (only for admins)
  const adminItems =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin')
      ? [
          { href: '/admin/listings', label: 'Moderation Queue', icon: Shield },
          { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
          { href: '/admin/legal', label: 'Legal Documents', icon: Scale },
        ]
      : [];

  const allItems = [...baseNavItems, ...authenticatedItems, ...adminItems];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform',
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo - Must align perfectly with header logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ESCROW</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {allItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer to push content up */}
        <div className="flex-1" />
      </div>
    </aside>
  );
}


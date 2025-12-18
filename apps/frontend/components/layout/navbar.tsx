'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Shield, Lock, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { FeedbackForm } from '@/components/beta/feedback-form';
import { useNotifications } from '@/lib/hooks/useNotifications';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clear } = useNotifications();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/catalog', label: 'Browse Listings' },
  ];

  const roleBasedLinks = {
    buyer: [
      { href: '/buyer/dashboard', label: 'My Purchases', icon: ShoppingBag },
    ],
    seller: [
      { href: '/seller/dashboard', label: 'My Listings', icon: User },
      { href: '/seller/submit', label: 'Submit Listing', icon: Shield },
    ],
    admin: [
      { href: '/buyer/dashboard', label: 'My Purchases', icon: ShoppingBag },
      { href: '/seller/dashboard', label: 'My Listings', icon: User },
      { href: '/admin/dashboard', label: 'Moderation Queue', icon: Shield },
      { href: '/admin/transactions', label: 'Transactions', icon: Lock },
    ],
    super_admin: [
      { href: '/buyer/dashboard', label: 'My Purchases', icon: ShoppingBag },
      { href: '/seller/dashboard', label: 'My Listings', icon: User },
      { href: '/admin/dashboard', label: 'Moderation Queue', icon: Shield },
      { href: '/admin/transactions', label: 'Transactions', icon: Lock },
    ],
  };

  const getRoleLinks = () => {
    if (!user?.role) return [];
    const links = roleBasedLinks[user.role as keyof typeof roleBasedLinks] || [];
    
    // For admins/super_admins, show both buyer and seller links
    // For regular users, show based on their role
    return links;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ESCROW</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Role-based links (only show when authenticated) */}
            {isAuthenticated &&
              getRoleLinks().map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationCenter
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClear={clear}
                />
                <FeedbackForm />
                <span className="hidden md:inline text-sm text-muted-foreground">
                  {user?.full_name || user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


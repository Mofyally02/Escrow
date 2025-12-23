'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hide navbar and footer on admin pages
  useEffect(() => {
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const mobileNav = document.querySelector('[data-mobile-nav]');
    
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (mobileNav) (mobileNav as HTMLElement).style.display = 'none';
    
    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      if (mobileNav) (mobileNav as HTMLElement).style.display = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminHeader />
      {/* Content wrapper: offset by sidebar (w-64 = 256px or w-16 = 64px when collapsed) and header height (64px = h-16) */}
      <main className="pt-16 transition-all duration-300 lg:ml-64" data-admin-main>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}


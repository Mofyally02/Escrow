'use client';

import { useAdminUsers } from '@/lib/hooks/useAdminData';
import { UserTable } from '@/components/admin/user-table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <UserTable users={users || []} isLoading={isLoading} />
    </>
  );
}

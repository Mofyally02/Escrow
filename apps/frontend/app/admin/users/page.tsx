'use client';

import { useAdminUsers } from '@/lib/hooks/useAdminUsers';
import { UserTable } from '@/components/admin/user-table';
import { Button } from '@/components/ui/button';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();

  const verifiedCount = users?.filter(
    (u) => u.is_email_verified && u.is_phone_verified
  ).length || 0;
  const unverifiedCount = (users?.length || 0) - verifiedCount;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts, permissions, and verification status
            </p>
          </div>
        </div>

        {users && users.length > 0 && (
          <div className="mt-4 flex gap-4">
            <Badge variant="outline" className="px-3 py-1">
              Total: {users.length}
            </Badge>
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              Verified: {verifiedCount}
            </Badge>
            {unverifiedCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                Unverified: {unverifiedCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      ) : (
        <>
          {users && users.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Temporary Verification Feature</p>
                    <p>
                      This manual verification feature is temporary until the OTP system is in place.
                      Use the action buttons to verify user email and phone numbers.
                    </p>
                  </div>
                </div>
              </div>
              <UserTable users={users} isLoading={isLoading} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

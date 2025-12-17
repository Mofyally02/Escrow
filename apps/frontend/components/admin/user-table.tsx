'use client';

import { Button } from '@/components/ui/button';
import { AdminUser } from '@/types/admin';
import { Badge } from '@/components/ui/badge';

interface UserTableProps {
  users: AdminUser[];
  isLoading?: boolean;
  onSuspend?: (userId: number) => void;
  onUnsuspend?: (userId: number) => void;
  onRoleChange?: (userId: number, newRole: string) => void;
}

export function UserTable({
  users,
  isLoading,
  onSuspend,
  onUnsuspend,
  onRoleChange,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Verified
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-sm">#{user.id}</td>
                <td className="px-6 py-4 font-medium">{user.full_name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="capitalize">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  {user.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      Suspended
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.is_verified ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSuspend?.(user.id)}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnsuspend?.(user.id)}
                      >
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


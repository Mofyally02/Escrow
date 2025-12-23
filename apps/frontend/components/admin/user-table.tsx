'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminUser } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import {
  useVerifyUserEmail,
  useVerifyUserPhone,
  useVerifyUserBoth,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
} from '@/lib/hooks/useAdminUsers';
import { Mail, Phone, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { SuspendUserDialog } from './suspend-user-dialog';
import { DeleteUserDialog } from './delete-user-dialog';

interface UserTableProps {
  users: AdminUser[];
  isLoading?: boolean;
}

export function UserTable({ users, isLoading }: UserTableProps) {
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const verifyEmail = useVerifyUserEmail();
  const verifyPhone = useVerifyUserPhone();
  const verifyBoth = useVerifyUserBoth();
  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();
  const deleteUser = useDeleteUser();

  const handleSuspendClick = (user: AdminUser) => {
    setSelectedUser(user);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = (reason: string, notes?: string) => {
    if (selectedUser) {
      suspendUser.mutate(
        { userId: selectedUser.id, reason, notes },
        {
          onSuccess: () => {
            setSuspendDialogOpen(false);
            setSelectedUser(null);
          },
        }
      );
    }
  };

  const handleUnsuspend = (userId: number) => {
    unsuspendUser.mutate(userId);
  };

  const handleDeleteClick = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = (reason: string) => {
    if (selectedUser) {
      deleteUser.mutate(
        { userId: selectedUser.id, reason },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
          },
        }
      );
    }
  };

  const isAdmin = (user: AdminUser) => {
    return user.role === 'admin' || user.role === 'super_admin';
  };

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
    <>
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
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verification
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
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {user.email}
                      {user.is_email_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {user.phone}
                      {user.is_phone_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
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
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        {user.is_email_verified ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {user.is_phone_verified ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            Phone
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            Phone
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1">
                        {!user.is_email_verified && (
                          <LoadingButton
                            variant="outline"
                            size="sm"
                            onClick={() => verifyEmail.mutate(user.id)}
                            isLoading={verifyEmail.isPending}
                            title="Verify Email"
                          >
                            <Mail className="h-3 w-3" />
                          </LoadingButton>
                        )}
                        {!user.is_phone_verified && (
                          <LoadingButton
                            variant="outline"
                            size="sm"
                            onClick={() => verifyPhone.mutate(user.id)}
                            isLoading={verifyPhone.isPending}
                            title="Verify Phone"
                          >
                            <Phone className="h-3 w-3" />
                          </LoadingButton>
                        )}
                        {(!user.is_email_verified || !user.is_phone_verified) && (
                          <LoadingButton
                            variant="outline"
                            size="sm"
                            onClick={() => verifyBoth.mutate(user.id)}
                            isLoading={verifyBoth.isPending}
                            title="Verify Both"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </LoadingButton>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {user.is_active ? (
                          !isAdmin(user) && (
                            <LoadingButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspendClick(user)}
                              isLoading={suspendUser.isPending}
                            >
                              Suspend
                            </LoadingButton>
                          )
                        ) : (
                          <LoadingButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnsuspend(user.id)}
                            isLoading={unsuspendUser.isPending}
                          >
                            Unsuspend
                          </LoadingButton>
                        )}
                        {!isAdmin(user) && (
                          <LoadingButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            isLoading={deleteUser.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </LoadingButton>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Dialog */}
      {selectedUser && (
        <SuspendUserDialog
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          onConfirm={handleSuspendConfirm}
          userEmail={selectedUser.email}
          isLoading={suspendUser.isPending}
        />
      )}

      {/* Delete Dialog */}
      {selectedUser && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          userEmail={selectedUser.email}
          isLoading={deleteUser.isPending}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredentialField } from './credential-field';
import { PasswordDialog } from './password-dialog';
import { useRevealCredentials, type CredentialRevealResponse } from '@/lib/hooks/useEscrowCompletion';
import { Loader2 } from 'lucide-react';

interface CredentialRevealBoxProps {
  transactionId: number;
  onRevealed: (credentials: CredentialRevealResponse) => void;
}

export function CredentialRevealBox({
  transactionId,
  onRevealed,
}: CredentialRevealBoxProps) {
  const [revealed, setRevealed] = useState(false);
  const [credentials, setCredentials] = useState<CredentialRevealResponse | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const revealMutation = useRevealCredentials();

  const handleReveal = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    try {
      const creds = await revealMutation.mutateAsync({
        transactionId,
        userPassword: password,
      });
      setCredentials(creds);
      setRevealed(true);
      onRevealed(creds);
      setShowPasswordDialog(false);
    } catch (error) {
      // Error handled by mutation - keep dialog open for retry
    }
  };

  if (revealed && credentials) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Warning Banner */}
        <div className="p-6 bg-yellow-50 border-2 border-yellow-600 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">
                ⚠️ One-Time Reveal
              </p>
              <p className="text-sm text-yellow-800">
                These credentials are shown only ONCE. Save them now. This page
                will self-destruct in 10 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-4 p-6 bg-card border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Account Credentials</h3>
          </div>

          <CredentialField
            label="Username"
            value={credentials.username}
          />
          <CredentialField
            label="Password"
            value={credentials.password}
            isPassword
          />
          {credentials.recovery_email && (
            <CredentialField
              label="Recovery Email"
              value={credentials.recovery_email}
            />
          )}
          {credentials.two_fa_secret && (
            <CredentialField
              label="2FA Secret"
              value={credentials.two_fa_secret}
            />
          )}
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-muted rounded-lg border border-dashed">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Security:</strong> These credentials are encrypted and
              stored securely. They will be cleared from memory when you leave
              this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center py-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Reveal Account Credentials</h3>
            <p className="text-muted-foreground mb-6">
              Click the button below to reveal your account credentials. This
              action can only be performed once.
            </p>
          </div>
          <Button
            onClick={handleReveal}
            disabled={revealMutation.isPending}
            size="lg"
            className="w-full"
          >
            {revealMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Revealing...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2" />
                Reveal Account Credentials
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            By clicking, you confirm that you have signed the digital contract
            and are ready to receive the account credentials.
          </p>
        </div>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirm={handlePasswordConfirm}
        isLoading={revealMutation.isPending}
      />
    </>
  );
}

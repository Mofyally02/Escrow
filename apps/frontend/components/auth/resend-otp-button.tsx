'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface ResendOTPButtonProps {
  onResend: () => Promise<void>;
  cooldownSeconds?: number;
  disabled?: boolean;
}

export function ResendOTPButton({
  onResend,
  cooldownSeconds = 60,
  disabled = false,
}: ResendOTPButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setCooldown(cooldownSeconds);
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleResend}
      disabled={cooldown > 0 || isResending || disabled}
      className="w-full"
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      {cooldown > 0
        ? `Resend in ${cooldown}s`
        : isResending
        ? 'Sending...'
        : 'Resend OTP'}
    </Button>
  );
}


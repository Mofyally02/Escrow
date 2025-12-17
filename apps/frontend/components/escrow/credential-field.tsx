'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CredentialFieldProps {
  label: string;
  value?: string | null;
  isPassword?: boolean;
  className?: string;
}

export function CredentialField({
  label,
  value,
  isPassword = false,
  className,
}: CredentialFieldProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!value) {
    return null;
  }

  const displayValue = isPassword && !showPassword ? '••••••••' : value;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={displayValue}
          readOnly
          className="font-mono bg-muted"
        />
        {isPassword && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowPassword(!showPassword)}
            className="flex-shrink-0"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="flex-shrink-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {copied && (
        <p className="text-xs text-green-600 animate-fade-in">Copied!</p>
      )}
    </div>
  );
}


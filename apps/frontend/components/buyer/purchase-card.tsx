'use client';

import Link from 'next/link';
import { Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface PurchaseCardProps {
  transaction: Transaction;
  className?: string;
}

const stateConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Payment Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-4 w-4" />,
  },
  funds_held: {
    label: 'Funds Held',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Shield className="h-4 w-4" />,
  },
  contract_signed: {
    label: 'Contract Signed',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Shield className="h-4 w-4" />,
  },
  credentials_released: {
    label: 'Credentials Revealed',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <Shield className="h-4 w-4" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <XCircle className="h-4 w-4" />,
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function PurchaseCard({ transaction, className }: PurchaseCardProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const config = stateConfig[transaction.state] || stateConfig.pending;

  return (
    <Link
      href={`/buyer/purchases/${transaction.id}`}
      className={cn(
        'block bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {transaction.listing?.title || `Transaction #${transaction.id}`}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{transaction.listing?.category}</span>
            <span>•</span>
            <span>{transaction.listing?.platform}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary mb-2">
            {formatPrice(transaction.amount_usd)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium',
            config.color
          )}
        >
          {config.icon}
          <span>{config.label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          View Details →
        </span>
      </div>
    </Link>
  );
}


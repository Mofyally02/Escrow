'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminTransaction } from '@/types/admin';
import { formatPrice } from '@/lib/utils';
import { TransactionState } from '@/types/transaction';

interface TransactionTableProps {
  transactions: AdminTransaction[];
  isLoading?: boolean;
}

const stateColors: Record<TransactionState, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  funds_held: 'bg-blue-100 text-blue-800',
  contract_signed: 'bg-purple-100 text-purple-800',
  credentials_released: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-red-100 text-red-800',
};

export function TransactionTable({
  transactions,
  isLoading,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No transactions found</p>
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
                Listing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                State
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
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-sm">
                  #{transaction.id}
                </td>
                <td className="px-6 py-4 text-sm">
                  {transaction.listing?.title || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {transaction.buyer?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {transaction.seller?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm font-semibold">
                  {formatPrice(transaction.amount_usd)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stateColors[transaction.state] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {transaction.state.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/transactions/${transaction.id}`}>
                      View
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

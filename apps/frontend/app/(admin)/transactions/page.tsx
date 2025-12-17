'use client';

import { useState } from 'react';
import { useAdminTransactions } from '@/lib/hooks/useAdminData';
import { TransactionTable } from '@/components/admin/transaction-table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TransactionState } from '@/types/transaction';

export default function AdminTransactionsPage() {
  const [filter, setFilter] = useState<TransactionState | 'all'>('all');
  const { data: transactions, isLoading } = useAdminTransactions(
    filter !== 'all' ? { state: filter } : undefined
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Monitor all escrow transactions
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'funds_held' ? 'default' : 'outline'}
            onClick={() => setFilter('funds_held')}
          >
            Funds Held
          </Button>
          <Button
            variant={filter === 'contract_signed' ? 'default' : 'outline'}
            onClick={() => setFilter('contract_signed')}
          >
            Contract Signed
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'disputed' ? 'default' : 'outline'}
            onClick={() => setFilter('disputed')}
          >
            Disputed
          </Button>
        </div>

        {/* Table */}
        <TransactionTable
          transactions={transactions || []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

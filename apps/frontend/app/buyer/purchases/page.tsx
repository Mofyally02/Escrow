'use client';

import { useState, useMemo } from 'react';
import { useBuyerTransactions } from '@/lib/hooks/useBuyerTransactions';
import { PurchaseCard } from '@/components/buyer/purchase-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TransactionState } from '@/types/transaction';

export default function PurchasesPage() {
  const { data: transactions, isLoading } = useBuyerTransactions();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    if (filter === 'all') return transactions;
    if (filter === 'active') {
      return transactions.filter(
        (t) =>
          !['completed', 'refunded'].includes(t.state) &&
          t.state !== 'disputed'
      );
    }
    if (filter === 'completed') {
      return transactions.filter((t) => t.state === 'completed');
    }
    return transactions;
  }, [transactions, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Purchases</h1>
          <p className="text-muted-foreground">
            Track all your transactions and purchases
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>

        {/* Transactions List */}
        {filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransactions.map((transaction) => (
              <PurchaseCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? "You haven't made any purchases yet"
                : `No ${filter} purchases found`}
            </p>
            <Button asChild>
              <a href="/catalog">Browse Catalog</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


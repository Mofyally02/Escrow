/**
 * TanStack Query Key Factory
 * Centralized query keys for consistent cache management
 */
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Listings
  listings: {
    all: ['listings'] as const,
    detail: (id: number) => ['listings', id] as const,
    bySeller: (sellerId: number) => ['listings', 'seller', sellerId] as const,
    catalog: (filters?: Record<string, unknown>) =>
      ['listings', 'catalog', filters] as const,
  },

  // Catalog (public)
  catalog: {
    all: (filters?: Record<string, unknown>) =>
      ['catalog', filters] as const,
    detail: (id: number) => ['catalog', id] as const,
    infinite: (filters?: Record<string, unknown>) =>
      ['catalog', 'infinite', filters] as const,
  },

  // Transactions
  transactions: {
    all: ['transactions'] as const,
    detail: (id: number) => ['transactions', id] as const,
    byBuyer: (buyerId: number) =>
      ['transactions', 'buyer', buyerId] as const,
    myPurchases: ['transactions', 'my-purchases'] as const,
  },

  // Admin
  admin: {
    listings: (filters?: Record<string, unknown>) =>
      ['admin', 'listings', filters] as const,
    transactions: (filters?: Record<string, unknown>) =>
      ['admin', 'transactions', filters] as const,
    users: ['admin', 'users'] as const,
    analytics: ['admin', 'analytics'] as const,
  },
} as const;


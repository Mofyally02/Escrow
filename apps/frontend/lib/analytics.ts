/**
 * Analytics integration
 * Supports PostHog and Plausible
 */

declare global {
  interface Window {
    posthog?: any;
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, properties);
  }

  // Plausible
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props: properties });
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties);
  }
}

// Common event helpers
export const analytics = {
  // Auth events
  register: (method: 'email' | 'phone') =>
    trackEvent('user_registered', { method }),
  login: () => trackEvent('user_logged_in'),
  logout: () => trackEvent('user_logged_out'),

  // Listing events
  listingCreated: (listingId: number) =>
    trackEvent('listing_created', { listing_id: listingId }),
  listingSubmitted: (listingId: number) =>
    trackEvent('listing_submitted', { listing_id: listingId }),
  listingApproved: (listingId: number) =>
    trackEvent('listing_approved', { listing_id: listingId }),

  // Transaction events
  purchaseInitiated: (transactionId: number, amount: number) =>
    trackEvent('purchase_initiated', {
      transaction_id: transactionId,
      amount,
    }),
  purchaseCompleted: (transactionId: number, amount: number) =>
    trackEvent('purchase_completed', {
      transaction_id: transactionId,
      amount,
    }),

  // Credential events
  credentialsRevealed: (transactionId: number) =>
    trackEvent('credentials_revealed', { transaction_id: transactionId }),
  accessConfirmed: (transactionId: number) =>
    trackEvent('access_confirmed', { transaction_id: transactionId }),

  // Page views
  pageView: (path: string) => trackEvent('page_view', { path }),

  // Search events
  searchPerformed: (query: string, resultsCount: number) =>
    trackEvent('search_performed', { query, results_count: resultsCount }),

  // Filter events
  filterApplied: (filters: Record<string, any>) =>
    trackEvent('filter_applied', filters),
};


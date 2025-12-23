/**
 * Transaction Types
 * Matching backend schemas
 */

export type TransactionState =
  // STEP 1: Initiate Purchase
  | 'purchase_initiated'
  // STEP 2: Payment
  | 'payment_pending'
  | 'funds_held'
  // STEP 3: Temporary Access
  | 'temporary_access_granted'
  // STEP 4: Verification Window
  | 'verification_window'
  // STEP 5: Ownership Agreement
  | 'ownership_agreement_pending'
  | 'ownership_agreement_signed'
  // STEP 6: Final Confirmation
  | 'funds_release_pending'
  | 'funds_released'
  // STEP 7: Transaction Closed
  | 'completed'
  // Terminal states
  | 'refunded'
  | 'disputed'
  | 'cancelled'
  // Legacy states (for backward compatibility)
  | 'pending'
  | 'contract_signed'
  | 'credentials_released';

export interface Transaction {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  amount_usd: number; // in cents
  state: TransactionState;
  paystack_reference: string | null;
  paystack_authorization_code: string | null;
  funds_held_at: string | null;
  contract_signed_at: string | null;
  credentials_released_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  buyer_confirmed_access: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  listing?: {
    id: number;
    title: string;
    category: string;
    platform: string;
    price_usd: number;
  };
  contract?: {
    id: number;
    pdf_url: string;
    signed_by_name: string | null;
    signed_at: string | null;
  };
}

export interface TransactionDetail extends Omit<Transaction, 'contract' | 'listing'> {
  listing: {
    id: number;
    title: string;
    category: string;
    platform: string;
    price_usd: number;
    description: string | null;
  };
  contract?: {
    id: number;
    pdf_url: string;
    signed_by_name: string | null;
    signed_at: string | null;
  } | null;
  payment_authorization_url?: string | null; // Paystack authorization URL
}

export interface TransactionCreate {
  listing_id: number;
}

export interface ContractSignRequest {
  signed_by_name: string;
}

export interface CredentialRevealResponse {
  username: string;
  password: string;
  recovery_email: string | null;
  two_fa_secret: string | null;
  revealed_at: string;
}


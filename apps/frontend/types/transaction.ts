/**
 * Transaction Types
 * Matching backend schemas
 */

export type TransactionState =
  | 'pending'
  | 'funds_held'
  | 'contract_signed'
  | 'credentials_released'
  | 'completed'
  | 'refunded'
  | 'disputed';

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


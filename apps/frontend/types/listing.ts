/**
 * Listing Types
 * Matching backend schemas
 */

export type ListingState =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'reserved'
  | 'sold';

export type ProofType = 'earnings' | 'profile' | 'reviews' | 'other';

export interface Listing {
  id: number;
  seller_id: number;
  title: string;
  category: string;
  platform: string;
  price_usd: number; // in cents
  description: string | null;
  state: ListingState;
  monthly_earnings: number | null; // in cents
  account_age_months: number | null;
  rating: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  proofs?: ListingProof[];
}

export interface ListingProof {
  id: number;
  listing_id: number;
  proof_type: ProofType;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  created_at: string;
}

export interface ListingCreate {
  title: string;
  category: string;
  platform: string;
  price_usd: number; // in cents
  description?: string;
  monthly_earnings?: number; // in cents
  account_age_months?: number;
  rating?: string;
  // Credentials (encrypted on backend)
  username: string;
  password: string;
  recovery_email?: string;
  two_fa_secret?: string;
  user_password: string; // User's password for encryption key derivation
}

export interface ListingUpdate {
  title?: string;
  category?: string;
  platform?: string;
  price_usd?: number;
  description?: string;
  monthly_earnings?: number;
  account_age_months?: number;
  rating?: string;
}

export interface ProofFileCreate {
  proof_type: ProofType;
  file: File;
  description?: string;
}


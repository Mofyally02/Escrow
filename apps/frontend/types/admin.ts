/**
 * Admin Types
 * Matching backend schemas
 */

import type { Listing } from '@/types/listing';
import type { Transaction } from '@/types/transaction';

export interface AdminListing extends Listing {
  seller: {
    id: number;
    full_name: string;
    email: string;
  };
  proof_count: number;
}

export interface AdminTransaction extends Transaction {
  buyer: {
    id: number;
    full_name: string;
    email: string;
  };
  seller: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  role: 'buyer' | 'seller' | 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  listings_count?: number;
  transactions_count?: number;
}

export interface ListingActionRequest {
  reason?: string;
  notes?: string;
}

export interface DisputeResolutionRequest {
  action: 'release' | 'refund';
  reason: string;
}

export interface AnalyticsData {
  total_listings: number;
  pending_listings: number;
  approved_listings: number;
  total_transactions: number;
  active_escrows: number;
  total_revenue: number;
  dispute_rate: number;
  average_transaction_value: number;
}


/**
 * Catalog and Listing Types
 * Matching backend schemas
 */

export interface CatalogListing {
  id: number;
  title: string;
  category: string;
  platform: string;
  price_usd: number;
  description: string;
  monthly_earnings: number | null;
  account_age_months: number | null;
  rating: string | null;
  state: 'approved' | 'reserved' | 'sold';
  seller_id: number;
  created_at: string;
  updated_at: string;
}

export interface ListingDetail extends CatalogListing {
  proof_count?: number;
  proofs?: ListingProof[];
  seller?: {
    id: number;
    full_name: string;
    email?: string;
  };
  // Note: Backend may not return seller details or proofs in public endpoint
  // These would be fetched separately if needed
}

export interface ListingProof {
  id: number;
  proof_type: 'earnings' | 'profile' | 'reviews' | 'other';
  file_url: string;
  file_name: string;
  description: string | null;
}

export interface CatalogFilters {
  category?: string;
  platform?: string;
  min_price?: number;
  max_price?: number;
  min_earnings?: number;
  max_earnings?: number;
  min_age?: number;
  max_age?: number;
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'earnings_high';
  search?: string;
}

export interface CatalogResponse {
  listings: CatalogListing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

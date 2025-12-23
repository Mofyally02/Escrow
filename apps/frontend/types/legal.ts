/**
 * Legal document types
 */
export type DocumentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'seller_agreement'
  | 'buyer_agreement'
  | 'disclaimer'
  | 'faq'
  | 'other';

export interface LegalDocument {
  id: number;
  title: string;
  slug: string;
  document_type: DocumentType;
  content_markdown: string;
  version: string;
  is_current: boolean;
  published_at: string | null;
  published_by_id: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface LegalDocumentPublic {
  id: number;
  title: string;
  slug: string;
  document_type: DocumentType;
  content_html: string;
  version: string;
  published_at: string | null;
  updated_at: string | null;
  effective_date: string;
}

export interface LegalDocumentList {
  id: number;
  title: string;
  slug: string;
  document_type: DocumentType;
  version: string;
  updated_at: string | null;
  published_at: string | null;
}

export interface LegalDocumentCreate {
  title: string;
  document_type: DocumentType;
  content_markdown: string;
  version: string;
  slug?: string;
}

export interface LegalDocumentUpdate {
  title?: string;
  content_markdown?: string;
  version?: string;
}

export interface LegalDocumentPublishRequest {
  version?: string;
}

export interface UserAcknowledgmentRequest {
  document_id: number;
  signed_by_name: string;  // Full legal name as digital signature
}

export interface UserAcknowledgmentResponse {
  user_id: number;
  document_id: number;
  acknowledged_at: string;
  document_version: string;
  document_title: string;
  signed_by_name?: string;
  signature_hash?: string;
}

export interface AcknowledgmentStatus {
  has_acknowledged: boolean;
  current_document: {
    id: number;
    version: string;
    title: string;
  } | null;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  seller_agreement: 'Seller Agreement',
  buyer_agreement: 'Buyer Agreement',
  disclaimer: 'Disclaimer',
  faq: 'FAQ',
  other: 'Other',
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  terms_of_service: '📜',
  privacy_policy: '🔒',
  seller_agreement: '✍️',
  buyer_agreement: '🤝',
  disclaimer: '⚠️',
  faq: '❓',
  other: '📄',
};


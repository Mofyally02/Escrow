/**
 * Buyer Confirmation Types
 * Matching backend schemas
 */

export type ConfirmationStage =
  | 'payment_complete'
  | 'contract_signing'
  | 'credential_reveal'
  | 'access_confirmation'
  | 'transaction_complete';

export interface BuyerConfirmation {
  id: number;
  transaction_id: number;
  buyer_id: number;
  stage: ConfirmationStage;
  confirmation_text: string;
  checkbox_label: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BuyerConfirmationCreate {
  stage: ConfirmationStage;
  confirmation_text: string;
  checkbox_label: string;
}


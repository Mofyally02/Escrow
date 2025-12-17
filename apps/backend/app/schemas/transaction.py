"""
Pydantic schemas for transactions.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.transaction import TransactionState


class TransactionCreate(BaseModel):
    """Schema for creating a transaction (initiating purchase)"""
    listing_id: int = Field(..., description="Listing ID to purchase")


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    amount_usd: int
    state: TransactionState
    paystack_reference: Optional[str]
    paystack_authorization_code: Optional[str]
    funds_held_at: Optional[str]
    contract_signed_at: Optional[str]
    credentials_released_at: Optional[str]
    access_confirmed_at: Optional[str]
    completed_at: Optional[str]
    payout_reference: Optional[str]
    commission_usd: Optional[int]
    payout_amount_usd: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TransactionDetailResponse(TransactionResponse):
    """Detailed transaction response"""
    buyer_confirmed_access: bool
    notes: Optional[str]
    
    class Config:
        from_attributes = True


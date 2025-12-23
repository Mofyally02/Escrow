"""
Pydantic schemas for transactions.
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.models.transaction import TransactionState


class TransactionListingInfo(BaseModel):
    """Minimal listing info for transaction response"""
    id: int
    title: str
    category: str
    platform: str
    price_usd: int
    
    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    """Schema for creating a transaction (initiating purchase)"""
    listing_id: int = Field(..., description="Listing ID to purchase")


class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    listing_id: int
    buyer_id: int
    seller_id: int
    amount_usd: int  # Legacy field (for backward compatibility)
    # Multi-currency support
    currency: Optional[str] = None  # Transaction currency (KSH, USD, EUR, GBP, CAD)
    amount: Optional[int] = None  # Amount in smallest unit of currency
    payment_currency: Optional[str] = None  # Payment currency (may differ from listing currency)
    payment_amount: Optional[int] = None  # Amount in payment currency
    state: TransactionState
    paystack_reference: Optional[str] = None
    paystack_authorization_code: Optional[str] = None
    paystack_customer_code: Optional[str] = None
    # Step-locked purchase flow timestamps
    purchase_initiated_at: Optional[str] = None
    payment_pending_at: Optional[str] = None
    funds_held_at: Optional[str] = None
    temporary_access_granted_at: Optional[str] = None
    verification_window_started_at: Optional[str] = None
    verification_deadline: Optional[str] = None
    account_verified_at: Optional[str] = None
    ownership_agreement_pending_at: Optional[str] = None
    ownership_agreement_signed_at: Optional[str] = None
    funds_release_pending_at: Optional[str] = None
    funds_released_at: Optional[str] = None
    completed_at: Optional[str] = None
    refunded_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    # Legacy fields (for backward compatibility, mapped from new fields)
    contract_signed_at: Optional[str] = Field(default=None)  # Maps to ownership_agreement_signed_at
    credentials_released_at: Optional[str] = Field(default=None)  # Maps to temporary_access_granted_at
    access_confirmed_at: Optional[str] = Field(default=None)  # Maps to account_verified_at
    # Payout details
    payout_reference: Optional[str] = None
    commission_usd: Optional[int] = None
    payout_amount_usd: Optional[int] = None
    created_at: datetime
    # Listing relationship (optional, only included if loaded)
    listing: Optional[TransactionListingInfo] = None
    
    @model_validator(mode='before')
    @classmethod
    def set_legacy_fields(cls, data):
        """Set legacy fields from new fields before validation"""
        if isinstance(data, dict):
            # Map new fields to legacy fields if legacy fields are missing
            if 'contract_signed_at' not in data and 'ownership_agreement_signed_at' in data:
                data['contract_signed_at'] = data.get('ownership_agreement_signed_at')
            if 'credentials_released_at' not in data and 'temporary_access_granted_at' in data:
                data['credentials_released_at'] = data.get('temporary_access_granted_at')
            if 'access_confirmed_at' not in data and 'account_verified_at' in data:
                data['access_confirmed_at'] = data.get('account_verified_at')
        return data
    
    @model_validator(mode='after')
    def populate_legacy_fields(self):
        """Populate legacy fields from new fields after validation"""
        # Map new fields to legacy fields if legacy fields are None
        if not self.contract_signed_at and self.ownership_agreement_signed_at:
            object.__setattr__(self, 'contract_signed_at', self.ownership_agreement_signed_at)
        if not self.credentials_released_at and self.temporary_access_granted_at:
            object.__setattr__(self, 'credentials_released_at', self.temporary_access_granted_at)
        if not self.access_confirmed_at and self.account_verified_at:
            object.__setattr__(self, 'access_confirmed_at', self.account_verified_at)
        
        # Ensure currency fields are strings (enums get serialized)
        if hasattr(self, 'currency') and self.currency:
            if hasattr(self.currency, 'value'):
                object.__setattr__(self, 'currency', self.currency.value)
        if hasattr(self, 'payment_currency') and self.payment_currency:
            if hasattr(self.payment_currency, 'value'):
                object.__setattr__(self, 'payment_currency', self.payment_currency.value)
        
        return self
    
    class Config:
        from_attributes = True


class TransactionDetailResponse(TransactionResponse):
    """Detailed transaction response"""
    buyer_confirmed_access: bool
    notes: Optional[str]
    payment_authorization_url: Optional[str] = None  # Paystack authorization URL
    
    class Config:
        from_attributes = True


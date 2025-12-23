"""
Schemas for step-locked seller sale flow.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class CredentialDeliveryRequest(BaseModel):
    """STEP 4: Secure credential delivery request"""
    username: str = Field(..., min_length=1, max_length=255, description="Account username")
    password: str = Field(..., min_length=1, description="Account password")
    recovery_email: Optional[str] = Field(None, description="Recovery email (optional)")
    two_fa_secret: Optional[str] = Field(None, description="2FA secret/recovery code (optional)")
    encryption_password: str = Field(..., min_length=8, description="Password for encrypting credentials")
    
    @validator('username', 'password')
    def validate_required_fields(cls, v):
        if not v or not v.strip():
            raise ValueError("Username and password are required")
        return v.strip()


class SellerTransactionStatusResponse(BaseModel):
    """Seller transaction status response"""
    transaction_id: int
    listing_id: int
    buyer_id: int  # Masked in production
    current_step: int
    current_state: str
    amount_usd: float
    funds_held: bool
    payment_confirmed: bool
    credentials_delivered: bool
    buyer_verified: bool
    ownership_signed: bool
    funds_released: bool
    can_deliver_credentials: bool
    delivery_reason: Optional[str] = None
    payment_confirmed_at: Optional[str] = None
    credentials_delivered_at: Optional[str] = None
    verification_deadline: Optional[str] = None
    funds_released_at: Optional[str] = None
    
    class Config:
        from_attributes = True


class SellerDashboardResponse(BaseModel):
    """Seller dashboard data"""
    active_transactions: list[SellerTransactionStatusResponse]
    completed_transactions: list[SellerTransactionStatusResponse]
    total_earnings_usd: float
    pending_earnings_usd: float
    active_count: int
    completed_count: int


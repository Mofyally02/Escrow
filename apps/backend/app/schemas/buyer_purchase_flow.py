"""
Schemas for step-locked buyer purchase flow.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class PurchaseInitiateRequest(BaseModel):
    """STEP 1: Initiate purchase request"""
    listing_id: int = Field(..., description="Listing ID to purchase")


class PaymentConfirmRequest(BaseModel):
    """STEP 2: Payment confirmation"""
    paystack_reference: str = Field(..., description="Paystack payment reference")
    paystack_authorization_code: Optional[str] = Field(None, description="Paystack authorization code")


class TemporaryAccessGrantRequest(BaseModel):
    """STEP 3: Grant temporary access (seller action, but tracked)"""
    access_duration_hours: int = Field(48, ge=1, le=168, description="Access duration in hours (1-168)")


class AccountVerificationRequest(BaseModel):
    """STEP 4: Buyer verifies account"""
    verified: bool = Field(True, description="Whether account is verified as valid")
    verification_notes: Optional[str] = Field(None, max_length=1000, description="Optional verification notes")


class OwnershipAgreementSignRequest(BaseModel):
    """STEP 5: Sign ownership agreement"""
    buyer_full_name: str = Field(..., min_length=2, max_length=255, description="Buyer's full legal name (must match profile)")
    verified_account: bool = Field(True, description="I have verified the account")
    accepts_ownership: bool = Field(True, description="I accept full ownership")
    accepts_risks: bool = Field(True, description="I accept all risks after transfer")
    platform_liability_ends: bool = Field(True, description="Platform liability ends at release")
    
    @validator('buyer_full_name')
    def validate_name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Full legal name is required")
        return v.strip()
    
    @validator('verified_account', 'accepts_ownership', 'accepts_risks', 'platform_liability_ends')
    def validate_all_acknowledgments(cls, v, values):
        if not v:
            raise ValueError("All agreement acknowledgments must be accepted")
        return v


class FundsReleaseRequest(BaseModel):
    """STEP 6: Request funds release"""
    confirm_ownership: bool = Field(True, description="I confirm ownership and request fund release")
    
    @validator('confirm_ownership')
    def validate_confirmation(cls, v):
        if not v:
            raise ValueError("You must confirm ownership to release funds")
        return v


class TransactionStepResponse(BaseModel):
    """Response showing current step and next available actions"""
    transaction_id: int
    current_step: int
    current_state: str
    can_proceed: bool
    next_step_available: bool
    step_requirements_met: dict
    verification_deadline: Optional[str] = None
    time_remaining_hours: Optional[float] = None
    # Payment data (for step 1)
    payment_authorization_url: Optional[str] = None
    paystack_reference: Optional[str] = None
    
    class Config:
        from_attributes = True


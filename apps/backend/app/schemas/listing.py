"""
Pydantic schemas for listing operations.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.listing import ListingState


class ListingBase(BaseModel):
    """Base listing schema"""
    title: str = Field(..., min_length=5, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    platform: str = Field(..., min_length=2, max_length=100)
    price_usd: int = Field(..., gt=0, description="Price in USD cents")
    description: Optional[str] = None
    monthly_earnings: Optional[int] = Field(None, ge=0, description="Monthly earnings in USD cents")
    account_age_months: Optional[int] = Field(None, ge=0)
    rating: Optional[str] = Field(None, max_length=10)


class ListingCreate(ListingBase):
    """Schema for creating a new listing"""
    # Credentials will be encrypted
    username: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1)
    recovery_email: Optional[str] = None
    two_fa_secret: Optional[str] = None
    # User password for encryption key derivation
    user_password: str = Field(..., min_length=8, description="User's password for encryption")
    
    @validator('price_usd')
    def validate_price(cls, v):
        """Price must be at least $10 (1000 cents)"""
        if v < 1000:
            raise ValueError("Price must be at least $10.00")
        return v


class ListingUpdate(BaseModel):
    """Schema for updating a listing (only in DRAFT state)"""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    platform: Optional[str] = Field(None, min_length=2, max_length=100)
    price_usd: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    monthly_earnings: Optional[int] = Field(None, ge=0)
    account_age_months: Optional[int] = Field(None, ge=0)
    rating: Optional[str] = Field(None, max_length=10)


class ListingResponse(BaseModel):
    """Schema for listing response (public view)"""
    id: int
    seller_id: int
    title: str
    category: str
    platform: str
    price_usd: int
    description: Optional[str]
    state: ListingState
    monthly_earnings: Optional[int]
    account_age_months: Optional[int]
    rating: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ListingDetailResponse(ListingResponse):
    """Schema for detailed listing view (includes admin fields)"""
    admin_notes: Optional[str]
    rejection_reason: Optional[str]
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    proof_count: int = 0
    
    class Config:
        from_attributes = True


class ListingStateChangeRequest(BaseModel):
    """Schema for state change requests"""
    new_state: ListingState
    reason: Optional[str] = None


class ProofFileCreate(BaseModel):
    """Schema for proof file upload"""
    proof_type: str = Field(..., description="Type of proof")
    file_url: str = Field(..., description="URL to uploaded file")
    file_name: str = Field(..., max_length=255)
    file_size: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class ProofFileResponse(BaseModel):
    """Schema for proof file response"""
    id: int
    listing_id: int
    proof_type: str
    file_url: str
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


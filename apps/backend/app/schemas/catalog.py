"""
Pydantic schemas for public catalog (read-only, no credentials).
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.listing import ListingState


class CatalogListingResponse(BaseModel):
    """Public listing response (no credentials, no seller details)"""
    id: int
    title: str
    category: str
    platform: str
    price_usd: int  # Price in USD cents
    description: Optional[str]
    monthly_earnings: Optional[int]
    account_age_months: Optional[int]
    rating: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class CatalogListingDetailResponse(CatalogListingResponse):
    """Detailed public listing (includes proof count)"""
    proof_count: int = 0
    
    class Config:
        from_attributes = True


"""
Schemas for listing draft operations.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class DraftData(BaseModel):
    """Draft data structure"""
    accountDetails: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    proofs: list = Field(default_factory=list)
    sellerAgreementAcknowledged: bool = False


class DraftResponse(BaseModel):
    """Draft response"""
    id: int
    seller_id: int
    data: Dict[str, Any]
    step: int
    status: str
    last_saved_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DraftUpdateRequest(BaseModel):
    """Request to update draft"""
    data: Dict[str, Any]
    step: int = Field(ge=0, le=3, description="Current step (0-3)")


class DraftSubmitRequest(BaseModel):
    """Request to submit draft as final listing"""
    pass  # Uses draft data directly


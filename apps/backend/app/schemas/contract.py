"""
Pydantic schemas for contracts.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ContractSignRequest(BaseModel):
    """Schema for signing contract"""
    full_name: str = Field(..., min_length=2, max_length=255, description="Buyer's full legal name (must match registration)")


class ContractResponse(BaseModel):
    """Schema for contract response"""
    id: int
    transaction_id: int
    pdf_url: Optional[str]
    pdf_hash: str
    signed_by_name: Optional[str]
    signed_at: Optional[str]
    contract_version: str
    is_signed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


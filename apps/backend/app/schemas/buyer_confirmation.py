"""
Pydantic schemas for Buyer Confirmation endpoints
"""
from pydantic import BaseModel, Field
from app.models.buyer_confirmation import ConfirmationStage
from datetime import datetime
from typing import Optional


class BuyerConfirmationCreate(BaseModel):
    """Schema for creating a buyer confirmation"""
    stage: ConfirmationStage
    confirmation_text: str = Field(..., min_length=10, max_length=2000, description="Exact checkbox text that was confirmed")
    checkbox_label: str = Field(..., min_length=5, max_length=500, description="Human-readable label for the checkbox")


class BuyerConfirmationResponse(BaseModel):
    """Schema for buyer confirmation response"""
    id: int
    transaction_id: int
    buyer_id: int
    stage: ConfirmationStage
    confirmation_text: str
    checkbox_label: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


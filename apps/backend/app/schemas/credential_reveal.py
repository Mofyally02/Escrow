"""
Pydantic schemas for credential reveal (one-time only).
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CredentialRevealRequest(BaseModel):
    """Schema for requesting credential reveal"""
    user_password: str = Field(..., min_length=8, description="User's password for decryption")


class CredentialRevealResponse(BaseModel):
    """Schema for revealed credentials (ONE-TIME ONLY)"""
    username: str
    password: str
    recovery_email: Optional[str] = None
    two_fa_secret: Optional[str] = None
    revealed_at: datetime
    warning: str = "⚠️ CRITICAL: These credentials are shown ONCE. Save them securely immediately. They will never be shown again."
    self_destruct_minutes: int = 5


class AccessConfirmationRequest(BaseModel):
    """Schema for buyer access confirmation"""
    confirmed: bool = Field(True, description="Buyer confirms successful access to account")


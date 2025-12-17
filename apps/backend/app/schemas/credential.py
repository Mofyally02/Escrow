"""
Pydantic schemas for credential operations.
Note: Credentials are never returned in plaintext except for one-time reveal.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CredentialStoreRequest(BaseModel):
    """Schema for storing credentials (encrypted)"""
    username: str
    password: str
    recovery_email: Optional[str] = None
    two_fa_secret: Optional[str] = None
    user_password: str  # For encryption key derivation


class CredentialRevealRequest(BaseModel):
    """Schema for one-time credential reveal"""
    user_password: str  # For decryption


class CredentialRevealResponse(BaseModel):
    """Schema for revealed credentials (one-time only)"""
    username: str
    password: str
    recovery_email: Optional[str]
    two_fa_secret: Optional[str]
    revealed_at: datetime
    warning: str = "These credentials are shown once. Save them securely."


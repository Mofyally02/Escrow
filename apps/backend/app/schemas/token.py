"""
Pydantic schemas for JWT tokens
"""
from pydantic import BaseModel
from typing import Optional


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None  # "access" or "refresh"


"""
Pydantic schemas for user-related operations.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema"""
    email: str
    phone: str
    full_name: str


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserInDB(UserBase):
    """User in database schema"""
    id: int
    role: str
    is_email_verified: bool
    is_phone_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

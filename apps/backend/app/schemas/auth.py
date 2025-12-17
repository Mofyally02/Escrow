"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=255)
    
    @validator('phone')
    def validate_phone(cls, v):
        """Basic phone validation - digits only"""
        if not v.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Phone number must contain only digits and formatting characters')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        """Password strength validation"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class VerifyOTPRequest(BaseModel):
    """OTP verification request"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    code: str = Field(..., min_length=6, max_length=6)
    
    @validator('code')
    def validate_code(cls, v):
        """OTP code must be 6 digits"""
        if not v.isdigit():
            raise ValueError('OTP code must be 6 digits')
        return v
    
    @validator('email', 'phone')
    def validate_identifier(cls, v, values):
        """Either email or phone must be provided"""
        if not v and not values.get('email') and not values.get('phone'):
            raise ValueError('Either email or phone must be provided')
        return v


class LoginRequest(BaseModel):
    """User login request"""
    email_or_phone: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UserResponse(BaseModel):
    """User profile response"""
    id: int
    email: str
    phone: str
    full_name: str
    role: str
    is_email_verified: bool
    is_phone_verified: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    """Update user profile request"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not v.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Phone number must contain only digits and formatting characters')
        return v


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True

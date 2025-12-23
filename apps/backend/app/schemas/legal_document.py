"""
Schemas for legal document operations.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.legal_document import DocumentType


class LegalDocumentBase(BaseModel):
    """Base schema for legal documents"""
    title: str = Field(..., min_length=1, max_length=255)
    document_type: DocumentType
    content_markdown: str = Field(..., min_length=1)
    version: str = Field(default="1.0", max_length=20)


class LegalDocumentCreate(LegalDocumentBase):
    """Schema for creating a new legal document"""
    slug: Optional[str] = Field(None, max_length=255)
    
    @validator('slug', pre=True, always=True)
    def generate_slug(cls, v, values):
        """Auto-generate slug from title if not provided"""
        if v:
            return v
        if 'title' in values:
            title = values['title']
            # Convert to slug: lowercase, replace spaces with hyphens, remove special chars
            slug = title.lower().replace(' ', '-')
            slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            return slug
        return None


class LegalDocumentUpdate(BaseModel):
    """Schema for updating a legal document"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content_markdown: Optional[str] = Field(None, min_length=1)
    version: Optional[str] = Field(None, max_length=20)


class LegalDocumentResponse(BaseModel):
    """Schema for legal document response"""
    id: int
    title: str
    slug: str
    document_type: DocumentType
    content_markdown: str
    version: str
    is_current: bool
    published_at: Optional[datetime]
    published_by_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class LegalDocumentPublicResponse(BaseModel):
    """Schema for public-facing legal document (HTML rendered)"""
    id: int
    title: str
    slug: str
    document_type: DocumentType
    content_html: str  # Rendered from markdown
    version: str
    published_at: Optional[datetime]
    updated_at: Optional[datetime]
    effective_date: Optional[datetime]  # Same as published_at or created_at
    
    class Config:
        from_attributes = True


class LegalDocumentListResponse(BaseModel):
    """Schema for listing legal documents (public)"""
    id: int
    title: str
    slug: str
    document_type: DocumentType
    version: str
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class LegalDocumentPublishRequest(BaseModel):
    """Schema for publishing a legal document"""
    version: Optional[str] = Field(None, max_length=20, description="New version number (auto-increments if not provided)")


class UserAcknowledgmentRequest(BaseModel):
    """Schema for user acknowledging a legal document"""
    document_id: int
    signed_by_name: str = Field(..., min_length=2, max_length=255, description="Full legal name as digital signature")
    
    @validator('signed_by_name')
    def validate_name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Full legal name is required for signature")
        return v.strip()


class UserAcknowledgmentResponse(BaseModel):
    """Schema for user acknowledgment response"""
    user_id: int
    document_id: int
    acknowledged_at: datetime
    document_version: str
    document_title: str
    signed_by_name: Optional[str] = None
    signature_hash: Optional[str] = None
    
    class Config:
        from_attributes = True


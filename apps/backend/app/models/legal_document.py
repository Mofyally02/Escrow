"""
Legal document model for managing Terms of Service, Privacy Policy, and other policy documents.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
import enum
from app.models.base import Timestamped


class DocumentType(str, enum.Enum):
    """Legal document types"""
    TOS = "terms_of_service"
    PRIVACY = "privacy_policy"
    SELLER_AGREEMENT = "seller_agreement"
    BUYER_AGREEMENT = "buyer_agreement"
    DISCLAIMER = "disclaimer"
    FAQ = "faq"
    OTHER = "other"


class LegalDocument(Timestamped):
    """Legal document model with versioning"""
    __tablename__ = "legal_documents"
    
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)  # e.g., "terms-of-service"
    document_type = Column(
        SQLEnum(DocumentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    content_markdown = Column(Text, nullable=False)  # Written in Markdown for rich formatting
    version = Column(String(20), default="1.0", nullable=False)  # e.g., "2.1"
    is_current = Column(Boolean, default=True, nullable=False, index=True)  # Only one per type is current
    published_at = Column(DateTime(timezone=True), nullable=True)
    published_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    published_by = relationship("User", foreign_keys=[published_by_id])
    
    def __repr__(self):
        return f"<LegalDocument(id={self.id}, title='{self.title}', version='{self.version}', is_current={self.is_current})>"


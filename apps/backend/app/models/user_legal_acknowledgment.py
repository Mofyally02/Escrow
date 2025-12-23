"""
User legal acknowledgment tracking model.
Tracks which users have acknowledged which versions of legal documents.
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Timestamped


class UserLegalAcknowledgment(Timestamped):
    """Tracks user acknowledgments of legal documents"""
    __tablename__ = "user_legal_acknowledgments"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Digital signature (full legal name)
    signed_by_name = Column(String(255), nullable=True)  # Full legal name as digital signature
    signature_hash = Column(String(64), nullable=True)  # SHA-256 hash for integrity verification
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    document = relationship("LegalDocument", foreign_keys=[document_id])
    
    # Ensure one acknowledgment per user per document version
    __table_args__ = (
        UniqueConstraint('user_id', 'document_id', name='uq_user_document_acknowledgment'),
    )
    
    def __repr__(self):
        return f"<UserLegalAcknowledgment(user_id={self.user_id}, document_id={self.document_id}, acknowledged_at={self.acknowledged_at})>"


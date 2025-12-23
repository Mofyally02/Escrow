"""
CRUD operations for user legal acknowledgments.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime
from app.models.user_legal_acknowledgment import UserLegalAcknowledgment
from app.models.legal_document import LegalDocument


def get_user_acknowledgment(
    db: Session,
    user_id: int,
    document_id: int
) -> Optional[UserLegalAcknowledgment]:
    """Get user acknowledgment for a specific document"""
    return db.query(UserLegalAcknowledgment).filter(
        and_(
            UserLegalAcknowledgment.user_id == user_id,
            UserLegalAcknowledgment.document_id == document_id
        )
    ).first()


def has_user_acknowledged(
    db: Session,
    user_id: int,
    document_id: int
) -> bool:
    """Check if user has acknowledged a document"""
    acknowledgment = get_user_acknowledgment(db, user_id, document_id)
    return acknowledgment is not None


def has_user_acknowledged_current(
    db: Session,
    user_id: int,
    document_type: str
) -> bool:
    """Check if user has acknowledged the current version of a document type"""
    # Get current document of this type
    current_doc = db.query(LegalDocument).filter(
        and_(
            LegalDocument.document_type == document_type,
            LegalDocument.is_current == True
        )
    ).first()
    
    if not current_doc:
        return False
    
    return has_user_acknowledged(db, user_id, current_doc.id)


def create_user_acknowledgment(
    db: Session,
    user_id: int,
    document_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    signed_by_name: Optional[str] = None,
    signature_hash: Optional[str] = None
) -> UserLegalAcknowledgment:
    """Create a new user acknowledgment with digital signature"""
    # Check if already acknowledged
    existing = get_user_acknowledgment(db, user_id, document_id)
    if existing:
        # Update timestamp and signature
        existing.acknowledged_at = datetime.utcnow()
        existing.ip_address = ip_address
        existing.user_agent = user_agent
        if signed_by_name:
            existing.signed_by_name = signed_by_name
        if signature_hash:
            existing.signature_hash = signature_hash
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new acknowledgment
    acknowledgment = UserLegalAcknowledgment(
        user_id=user_id,
        document_id=document_id,
        acknowledged_at=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent,
        signed_by_name=signed_by_name,
        signature_hash=signature_hash
    )
    
    db.add(acknowledgment)
    db.commit()
    db.refresh(acknowledgment)
    
    return acknowledgment


def get_user_acknowledgments(
    db: Session,
    user_id: int
) -> List[UserLegalAcknowledgment]:
    """Get all acknowledgments for a user"""
    return db.query(UserLegalAcknowledgment).filter(
        UserLegalAcknowledgment.user_id == user_id
    ).all()


"""
CRUD operations for listing drafts.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.listing_draft import ListingDraft, DraftStatus


def get_or_create_draft(
    db: Session,
    seller_id: int
) -> ListingDraft:
    """
    Get existing draft or create a new one.
    Only one active draft per seller.
    If a SUBMITTED draft exists, delete it first (hard delete).
    """
    # First check for an active DRAFT
    draft = db.query(ListingDraft).filter(
        ListingDraft.seller_id == seller_id,
        ListingDraft.status == DraftStatus.DRAFT
    ).first()
    
    if draft:
        return draft
    
    # If no DRAFT exists, check for SUBMITTED draft and delete it
    # (This handles the case where a previous draft was submitted but not deleted)
    submitted_draft = db.query(ListingDraft).filter(
        ListingDraft.seller_id == seller_id,
        ListingDraft.status == DraftStatus.SUBMITTED
    ).first()
    
    if submitted_draft:
        # Hard delete the submitted draft to allow creating a new one
        db.delete(submitted_draft)
        db.commit()
    
    # Now create a new draft
    draft = ListingDraft(
        seller_id=seller_id,
        data={},
        step=0,
        status=DraftStatus.DRAFT,
        last_saved_at=datetime.utcnow()
    )
    db.add(draft)
    db.flush()  # Flush to get created_at from server_default
    db.refresh(draft)
    db.commit()  # Commit the new draft
    
    return draft


def update_draft(
    db: Session,
    seller_id: int,
    data: Dict[str, Any],
    step: int
) -> ListingDraft:
    """
    Update draft data and step.
    Idempotent - can be called multiple times safely.
    """
    # Get existing draft or create new one
    draft = get_or_create_draft(db, seller_id)
    
    # Update draft fields
    draft.data = data
    draft.step = step
    draft.last_saved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(draft)
    
    return draft


def get_draft(
    db: Session,
    seller_id: int
) -> Optional[ListingDraft]:
    """Get current draft for seller"""
    return db.query(ListingDraft).filter(
        ListingDraft.seller_id == seller_id,
        ListingDraft.status == DraftStatus.DRAFT
    ).first()


def delete_draft(
    db: Session,
    seller_id: int
) -> bool:
    """
    Delete draft (hard delete).
    Called after successful listing submission.
    """
    draft = get_draft(db, seller_id)
    if draft:
        db.delete(draft)
        db.commit()
        return True
    return False


def mark_draft_submitted(
    db: Session,
    seller_id: int
) -> bool:
    """Mark draft as submitted"""
    draft = get_draft(db, seller_id)
    if draft:
        draft.status = DraftStatus.SUBMITTED
        db.commit()
        return True
    return False


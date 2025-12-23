"""
CRUD operations for Buyer Confirmation model
"""
from sqlalchemy.orm import Session
from app.models.buyer_confirmation import BuyerConfirmation, ConfirmationStage
from app.models.transaction import Transaction
from typing import List, Optional


def create_buyer_confirmation(
    db: Session,
    transaction_id: int,
    buyer_id: int,
    stage: ConfirmationStage,
    confirmation_text: str,
    checkbox_label: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> BuyerConfirmation:
    """
    Create a new buyer confirmation record.
    This is immutable - once created, it cannot be modified.
    """
    confirmation = BuyerConfirmation(
        transaction_id=transaction_id,
        buyer_id=buyer_id,
        stage=stage,
        confirmation_text=confirmation_text,
        checkbox_label=checkbox_label,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(confirmation)
    db.commit()
    db.refresh(confirmation)
    return confirmation


def get_confirmations_by_transaction(
    db: Session,
    transaction_id: int,
) -> List[BuyerConfirmation]:
    """Get all confirmations for a transaction, ordered by creation time"""
    return (
        db.query(BuyerConfirmation)
        .filter(BuyerConfirmation.transaction_id == transaction_id)
        .order_by(BuyerConfirmation.created_at.asc())
        .all()
    )


def get_confirmation_by_stage(
    db: Session,
    transaction_id: int,
    stage: ConfirmationStage,
) -> Optional[BuyerConfirmation]:
    """Get the most recent confirmation for a specific stage"""
    return (
        db.query(BuyerConfirmation)
        .filter(
            BuyerConfirmation.transaction_id == transaction_id,
            BuyerConfirmation.stage == stage,
        )
        .order_by(BuyerConfirmation.created_at.desc())
        .first()
    )


def has_confirmation_for_stage(
    db: Session,
    transaction_id: int,
    stage: ConfirmationStage,
) -> bool:
    """Check if a confirmation exists for a specific stage"""
    return (
        db.query(BuyerConfirmation)
        .filter(
            BuyerConfirmation.transaction_id == transaction_id,
            BuyerConfirmation.stage == stage,
        )
        .first()
        is not None
    )


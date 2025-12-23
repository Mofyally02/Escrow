"""
CRUD operations for escrow completion and payout.
"""
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.transaction import Transaction, TransactionState
from app.models.listing import Listing, ListingState


def mark_access_confirmed(
    db: Session,
    transaction: Transaction
) -> Transaction:
    """
    Mark buyer access as confirmed.
    
    Args:
        db: Database session
        transaction: Transaction to update
        
    Returns:
        Updated Transaction
    """
    transaction.buyer_confirmed_access = True
    transaction.access_confirmed_at = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def finalize_transaction(
    db: Session,
    transaction: Transaction,
    commission_usd: int,
    payout_amount_usd: int,
    payout_reference: str
) -> Transaction:
    """
    Finalize transaction with payout details.
    
    Args:
        db: Database session
        transaction: Transaction to finalize
        commission_usd: Platform commission in USD cents
        payout_amount_usd: Amount to seller in USD cents
        payout_reference: Paystack transfer reference
        
    Returns:
        Finalized Transaction
    """
    transaction.commission_usd = commission_usd
    transaction.payout_amount_usd = payout_amount_usd
    transaction.payout_reference = payout_reference
    transaction.completed_at = datetime.utcnow().isoformat()
    
    # Mark listing as SOLD
    listing = db.query(Listing).filter(Listing.id == transaction.listing_id).first()
    if listing:
        listing.state = ListingState.SOLD
    
    # Update transaction state
    transaction.state = TransactionState.COMPLETED
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def process_refund(
    db: Session,
    transaction: Transaction,
    reason: str,
    admin_id: int
) -> Transaction:
    """
    Process refund (Super Admin only).
    
    Args:
        db: Database session
        transaction: Transaction to refund
        reason: Reason for refund
        admin_id: Admin user ID
        
    Returns:
        Refunded Transaction
    """
    transaction.state = TransactionState.REFUNDED
    transaction.refunded_at = datetime.utcnow().isoformat()
    transaction.notes = f"Refunded by admin {admin_id}. Reason: {reason}"
    
    # Return listing to APPROVED state (seller can relist)
    listing = db.query(Listing).filter(Listing.id == transaction.listing_id).first()
    if listing:
        listing.state = ListingState.APPROVED
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def force_release(
    db: Session,
    transaction: Transaction,
    reason: str,
    admin_id: int
) -> Transaction:
    """
    Force release funds to seller (Super Admin override).
    
    Args:
        db: Database session
        transaction: Transaction to release
        reason: Reason for forced release
        admin_id: Admin user ID
        
    Returns:
        Released Transaction
    """
    transaction.state = TransactionState.COMPLETED
    transaction.completed_at = datetime.utcnow().isoformat()
    transaction.notes = f"Forced release by admin {admin_id}. Reason: {reason}"
    
    # Mark listing as SOLD
    listing = db.query(Listing).filter(Listing.id == transaction.listing_id).first()
    if listing:
        listing.state = ListingState.SOLD
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


"""
CRUD operations for transactions.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from app.models.transaction import Transaction, TransactionState
from app.models.listing import Listing, ListingState
from app.models.contract import Contract
from app.models.payment_event import PaymentEvent, PaymentEventType


def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
    """Get transaction by ID"""
    return db.query(Transaction).filter(Transaction.id == transaction_id).first()


def get_transaction_by_listing_id(db: Session, listing_id: int) -> Optional[Transaction]:
    """Get transaction by listing ID"""
    return db.query(Transaction).filter(Transaction.listing_id == listing_id).first()


def get_transactions_by_buyer(
    db: Session,
    buyer_id: int,
    state: Optional[TransactionState] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Transaction]:
    """Get transactions by buyer with optional state filter"""
    from sqlalchemy.orm import joinedload
    query = db.query(Transaction).options(joinedload(Transaction.listing)).filter(Transaction.buyer_id == buyer_id)
    if state:
        query = query.filter(Transaction.state == state)
    return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()


def create_transaction(
    db: Session,
    listing_id: int,
    buyer_id: int,
    amount_usd: int,
    paystack_reference: str
) -> Transaction:
    """
    Create a new transaction.
    
    Args:
        db: Database session
        listing_id: Listing ID
        buyer_id: Buyer user ID
        amount_usd: Amount in USD cents
        paystack_reference: Paystack transaction reference
        
    Returns:
        Created Transaction
    """
    # Get listing to get seller_id
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise ValueError("Listing not found")
    
    if listing.state != ListingState.APPROVED:
        raise ValueError("Only approved listings can be purchased")
    
    # Check if listing already has a transaction
    existing = get_transaction_by_listing_id(db, listing_id)
    if existing:
        raise ValueError("Listing already has an active transaction")
    
    # Create transaction
    transaction = Transaction(
        listing_id=listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
        amount_usd=amount_usd,
        state=TransactionState.PURCHASE_INITIATED,
        paystack_reference=paystack_reference
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def update_transaction_state(
    db: Session,
    transaction: Transaction,
    new_state: TransactionState,
    paystack_authorization_code: Optional[str] = None
) -> Transaction:
    """
    Update transaction state with validation.
    
    Args:
        db: Database session
        transaction: Transaction to update
        new_state: New state
        paystack_authorization_code: Authorization code (if funds held)
        
    Returns:
        Updated Transaction
    """
    if not transaction.can_transition_to(new_state):
        raise ValueError(f"Cannot transition from {transaction.state} to {new_state}")
    
    transaction.state = new_state
    
    # Update timestamps
    now = datetime.utcnow().isoformat()
    if new_state == TransactionState.FUNDS_HELD:
        transaction.funds_held_at = now
        transaction.paystack_authorization_code = paystack_authorization_code
        # Update listing to RESERVED
        listing = db.query(Listing).filter(Listing.id == transaction.listing_id).first()
        if listing:
            listing.state = ListingState.RESERVED
    elif new_state == TransactionState.OWNERSHIP_AGREEMENT_SIGNED:
        transaction.ownership_agreement_signed_at = now
    elif new_state == TransactionState.TEMPORARY_ACCESS_GRANTED:
        transaction.temporary_access_granted_at = now
    elif new_state == TransactionState.COMPLETED:
        transaction.completed_at = now
    elif new_state == TransactionState.REFUNDED:
        transaction.refunded_at = now
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def create_contract(
    db: Session,
    transaction_id: int,
    pdf_hash: str,
    pdf_url: Optional[str] = None
) -> Contract:
    """
    Create a contract for a transaction.
    
    Args:
        db: Database session
        transaction_id: Transaction ID
        pdf_hash: SHA-256 hash of PDF
        pdf_url: URL to stored PDF
        
    Returns:
        Created Contract
    """
    contract = Contract(
        transaction_id=transaction_id,
        pdf_hash=pdf_hash,
        pdf_url=pdf_url
    )
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    return contract


def sign_contract(
    db: Session,
    contract: Contract,
    signed_by_name: str
) -> Contract:
    """
    Sign a contract.
    
    Args:
        db: Database session
        contract: Contract to sign
        signed_by_name: Buyer's full legal name
        
    Returns:
        Signed Contract
    """
    contract.signed_by_name = signed_by_name
    contract.signed_at = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(contract)
    
    return contract


def create_payment_event(
    db: Session,
    transaction_id: int,
    event_type: PaymentEventType,
    payload: str,
    paystack_event_id: Optional[str] = None,
    paystack_reference: Optional[str] = None,
    signature_verified: bool = False
) -> PaymentEvent:
    """
    Create a payment event from webhook.
    
    Args:
        db: Database session
        transaction_id: Transaction ID
        event_type: Event type
        payload: Full webhook payload (JSON string)
        paystack_event_id: Paystack event ID
        paystack_reference: Paystack reference
        signature_verified: Whether signature was verified
        
    Returns:
        Created PaymentEvent
    """
    event = PaymentEvent(
        transaction_id=transaction_id,
        event_type=event_type,
        payload=payload,
        paystack_event_id=paystack_event_id,
        paystack_reference=paystack_reference,
        signature_verified=signature_verified
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return event


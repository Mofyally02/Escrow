"""
CRUD operations for step-locked buyer purchase flow.
Each step must be completed before proceeding to the next.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.models.transaction import Transaction, TransactionState
from app.models.listing import Listing, ListingState
from app.models.ownership_agreement import OwnershipAgreement
from app.models.temporary_access import TemporaryAccess
from app.models.credential_vault import CredentialVault


def initiate_purchase(
    db: Session,
    listing_id: int,
    buyer_id: int
) -> Transaction:
    """
    STEP 1: Initiate Secure Purchase
    - Lock listing to buyer
    - Create transaction in PURCHASE_INITIATED state
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise ValueError("Listing not found")
    
    if listing.state != ListingState.APPROVED:
        raise ValueError("Only approved listings can be purchased")
    
    # Check for existing transaction
    existing = db.query(Transaction).filter(
        Transaction.listing_id == listing_id,
        Transaction.state.notin_([
            TransactionState.REFUNDED,
            TransactionState.CANCELLED,
            TransactionState.COMPLETED
        ])
    ).first()
    
    if existing:
        raise ValueError("Listing already has an active transaction")
    
    # Create transaction
    transaction = Transaction(
        listing_id=listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
        amount_usd=listing.price_usd,
        state=TransactionState.PURCHASE_INITIATED,
        purchase_initiated_at=datetime.utcnow().isoformat()
    )
    
    # Lock listing
    listing.state = ListingState.RESERVED
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def confirm_payment(
    db: Session,
    transaction: Transaction,
    paystack_reference: str,
    paystack_authorization_code: Optional[str] = None
) -> Transaction:
    """
    STEP 2: Make Escrow Payment
    - Update transaction to FUNDS_HELD
    - Store payment details
    """
    if transaction.state != TransactionState.PURCHASE_INITIATED:
        raise ValueError(f"Cannot confirm payment. Current state: {transaction.state.value}")
    
    transaction.state = TransactionState.FUNDS_HELD
    transaction.funds_held_at = datetime.utcnow().isoformat()
    transaction.paystack_reference = paystack_reference
    if paystack_authorization_code:
        transaction.paystack_authorization_code = paystack_authorization_code
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def grant_temporary_access(
    db: Session,
    transaction: Transaction,
    access_duration_hours: int = 48
) -> TemporaryAccess:
    """
    STEP 3: Receive Limited Account Access
    - Get existing temporary access record (created by seller when delivering credentials)
    - Verify credentials have been delivered
    - Update transaction state if needed
    """
    # Check if credentials have been delivered
    if not transaction.listing or not transaction.listing.credentials:
        raise ValueError("Credentials have not been delivered yet. Please wait for seller to deliver credentials.")
    
    # Check if temporary access already exists (created by seller)
    existing = db.query(TemporaryAccess).filter(
        TemporaryAccess.transaction_id == transaction.id
    ).first()
    
    if not existing:
        # If seller hasn't created it yet, create it here (fallback)
        # This should normally be created by seller when delivering credentials
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=access_duration_hours)
        
        existing = TemporaryAccess(
            transaction_id=transaction.id,
            access_granted_at=now,
            access_expires_at=expires_at,
            max_login_attempts=10
        )
        db.add(existing)
    
    # Update transaction state if needed
    if transaction.state == TransactionState.FUNDS_HELD:
        transaction.state = TransactionState.TEMPORARY_ACCESS_GRANTED
        transaction.temporary_access_granted_at = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(existing)
    
    return existing


def start_verification_window(
    db: Session,
    transaction: Transaction,
    verification_duration_hours: int = 48
) -> Transaction:
    """
    STEP 4: Account Validation & Verification Window
    - Start verification window
    - Set deadline
    - Update transaction state
    """
    if transaction.state != TransactionState.TEMPORARY_ACCESS_GRANTED:
        raise ValueError(f"Cannot start verification window. Current state: {transaction.state.value}")
    
    # Check temporary access exists and is active
    temp_access = db.query(TemporaryAccess).filter(
        TemporaryAccess.transaction_id == transaction.id
    ).first()
    
    if not temp_access or not temp_access.is_active:
        raise ValueError("Temporary access is not active")
    
    now = datetime.utcnow()
    deadline = now + timedelta(hours=verification_duration_hours)
    
    transaction.state = TransactionState.VERIFICATION_WINDOW
    transaction.verification_window_started_at = now.isoformat()
    transaction.verification_deadline = deadline.isoformat()
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def verify_account(
    db: Session,
    transaction: Transaction,
    verified: bool = True
) -> Transaction:
    """
    STEP 4: Buyer verifies account
    - Mark account as verified
    - Can proceed to ownership agreement
    """
    if transaction.state != TransactionState.VERIFICATION_WINDOW:
        raise ValueError(f"Cannot verify account. Current state: {transaction.state.value}")
    
    transaction.account_verified = verified
    transaction.account_verified_at = datetime.utcnow().isoformat()
    
    if verified:
        # Can proceed to ownership agreement
        transaction.state = TransactionState.OWNERSHIP_AGREEMENT_PENDING
        transaction.ownership_agreement_pending_at = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def create_ownership_agreement(
    db: Session,
    transaction: Transaction,
    agreement_content: str,
    agreement_version: str = "1.0"
) -> OwnershipAgreement:
    """
    STEP 5: Create Ownership Transfer Agreement
    - Generate agreement document
    - Ready for buyer signature
    """
    if transaction.state != TransactionState.OWNERSHIP_AGREEMENT_PENDING:
        raise ValueError(f"Cannot create ownership agreement. Current state: {transaction.state.value}")
    
    # Check if agreement already exists
    existing = db.query(OwnershipAgreement).filter(
        OwnershipAgreement.transaction_id == transaction.id
    ).first()
    
    if existing:
        return existing
    
    agreement = OwnershipAgreement(
        transaction_id=transaction.id,
        agreement_content=agreement_content,
        agreement_version=agreement_version,
        effective_date=datetime.utcnow()
    )
    
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
    
    return agreement


def sign_ownership_agreement(
    db: Session,
    transaction: Transaction,
    buyer_full_name: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    verified_account: bool = False,
    accepts_ownership: bool = False,
    accepts_risks: bool = False,
    platform_liability_ends: bool = False
) -> OwnershipAgreement:
    """
    STEP 5: Sign Ownership Transfer Agreement
    - Validate buyer name matches profile
    - Generate signature hash
    - Update transaction state
    """
    if transaction.state != TransactionState.OWNERSHIP_AGREEMENT_PENDING:
        raise ValueError(f"Cannot sign agreement. Current state: {transaction.state.value}")
    
    agreement = db.query(OwnershipAgreement).filter(
        OwnershipAgreement.transaction_id == transaction.id
    ).first()
    
    if not agreement:
        raise ValueError("Ownership agreement not found")
    
    # Validate all acknowledgments are true
    if not (verified_account and accepts_ownership and accepts_risks and platform_liability_ends):
        raise ValueError("All agreement acknowledgments must be accepted")
    
    # Validate buyer name matches profile
    buyer = transaction.buyer
    if buyer.full_name.lower().strip() != buyer_full_name.lower().strip():
        raise ValueError("Signature name must match your registered full name")
    
    # Sign agreement
    now = datetime.utcnow()
    agreement.signed_by_name = buyer_full_name
    agreement.signed_at = now
    agreement.signature_hash = agreement.generate_signature_hash(buyer_full_name, now.isoformat())
    agreement.ip_address = ip_address
    agreement.user_agent = user_agent
    agreement.verified_account_acknowledged = verified_account
    agreement.accepts_ownership_acknowledged = accepts_ownership
    agreement.accepts_risks_acknowledged = accepts_risks
    agreement.platform_liability_ends_acknowledged = platform_liability_ends
    
    # Update transaction state
    transaction.state = TransactionState.OWNERSHIP_AGREEMENT_SIGNED
    transaction.ownership_agreement_signed_at = now.isoformat()
    
    db.commit()
    db.refresh(agreement)
    
    return agreement


def request_funds_release(
    db: Session,
    transaction: Transaction
) -> Transaction:
    """
    STEP 6: Final Confirmation & Fund Release
    - Buyer confirms ownership and requests fund release
    - Update transaction state
    - Funds will be released by payout service
    """
    if transaction.state != TransactionState.OWNERSHIP_AGREEMENT_SIGNED:
        raise ValueError(f"Cannot request funds release. Current state: {transaction.state.value}")
    
    # Verify agreement is signed
    agreement = db.query(OwnershipAgreement).filter(
        OwnershipAgreement.transaction_id == transaction.id
    ).first()
    
    if not agreement or not agreement.is_signed:
        raise ValueError("Ownership agreement must be signed before releasing funds")
    
    transaction.state = TransactionState.FUNDS_RELEASE_PENDING
    transaction.funds_release_pending_at = datetime.utcnow().isoformat()
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def release_funds(
    db: Session,
    transaction: Transaction,
    payout_reference: str,
    commission_usd: int,
    payout_amount_usd: int
) -> Transaction:
    """
    STEP 6: Release funds to seller
    - Update transaction to FUNDS_RELEASED
    - Store payout details
    - This triggers automatic completion
    """
    if transaction.state != TransactionState.FUNDS_RELEASE_PENDING:
        raise ValueError(f"Cannot release funds. Current state: {transaction.state.value}")
    
    transaction.state = TransactionState.FUNDS_RELEASED
    transaction.funds_released_at = datetime.utcnow().isoformat()
    transaction.payout_reference = payout_reference
    transaction.commission_usd = commission_usd
    transaction.payout_amount_usd = payout_amount_usd
    
    # Automatically move to completed
    transaction.state = TransactionState.COMPLETED
    transaction.completed_at = datetime.utcnow().isoformat()
    
    # Mark listing as SOLD
    listing = transaction.listing
    if listing:
        listing.state = ListingState.SOLD
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


def open_dispute(
    db: Session,
    transaction: Transaction,
    reason: str
) -> Transaction:
    """
    Open dispute (can be done during verification window or before ownership agreement)
    """
    valid_states = [
        TransactionState.VERIFICATION_WINDOW,
        TransactionState.OWNERSHIP_AGREEMENT_PENDING,
        TransactionState.FUNDS_RELEASE_PENDING
    ]
    
    if transaction.state not in valid_states:
        raise ValueError(f"Cannot open dispute. Current state: {transaction.state.value}")
    
    transaction.state = TransactionState.DISPUTED
    transaction.notes = f"Dispute opened: {reason}"
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


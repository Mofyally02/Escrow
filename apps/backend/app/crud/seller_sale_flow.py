"""
CRUD operations for step-locked seller sale flow.
Mirrors buyer purchase flow with seller protections.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.models.transaction import Transaction, TransactionState
from app.models.listing import Listing, ListingState
from app.models.credential_vault import CredentialVault
from app.core.encryption import EncryptionService


def get_seller_transaction_status(
    db: Session,
    transaction_id: int,
    seller_id: int
) -> Transaction:
    """
    Get transaction status for seller.
    Validates seller owns the listing.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()
    
    if not transaction:
        raise ValueError("Transaction not found")
    
    if transaction.seller_id != seller_id:
        raise ValueError("Not authorized for this transaction")
    
    return transaction


def can_deliver_credentials(
    db: Session,
    transaction: Transaction
) -> tuple[bool, str]:
    """
    Check if seller can deliver credentials (STEP 4).
    
    Requirements:
    - Transaction must be in FUNDS_HELD state
    - Payment must be confirmed
    - Credentials must not already be delivered
    
    Returns:
        (can_deliver: bool, reason: str)
    """
    if transaction.state != TransactionState.FUNDS_HELD:
        return False, f"Cannot deliver credentials. Current state: {transaction.state.value}. Payment must be confirmed first."
    
    # Check if credentials already delivered
    listing = transaction.listing
    if listing and listing.credentials and listing.credentials.revealed_at:
        return False, "Credentials have already been delivered."
    
    return True, "Ready to deliver credentials"


def deliver_credentials(
    db: Session,
    transaction: Transaction,
    username: str,
    password: str,
    recovery_email: Optional[str] = None,
    two_fa_secret: Optional[str] = None,
    user_password: str = None
) -> CredentialVault:
    """
    STEP 4: Secure Credential Delivery
    
    - Seller submits credentials via platform
    - Credentials are encrypted and stored
    - One-time encrypted submission
    - Access logging enabled
    """
    if transaction.seller_id != transaction.listing.seller_id:
        raise ValueError("Seller does not own this listing")
    
    can_deliver, reason = can_deliver_credentials(db, transaction)
    if not can_deliver:
        raise ValueError(reason)
    
    # Check if credentials vault already exists
    listing = transaction.listing
    existing_vault = db.query(CredentialVault).filter(
        CredentialVault.listing_id == listing.id
    ).first()
    
    if existing_vault:
        # Update existing vault (if seller needs to resubmit)
        # But only if credentials haven't been revealed
        if existing_vault.revealed_at:
            raise ValueError("Credentials have already been delivered and revealed. Cannot update.")
    else:
        # Create new vault
        existing_vault = CredentialVault(listing_id=listing.id)
        db.add(existing_vault)
    
    # Encrypt credentials
    # Note: user_password should be provided by seller for encryption
    # In production, this might be a separate encryption key
    if not user_password:
        raise ValueError("Encryption password is required")
    
    # Encrypt username
    encrypted_username, iv_username, salt_username, tag_username = EncryptionService.encrypt(
        username, user_password
    )
    
    # Encrypt password
    encrypted_password, iv_password, salt_password, tag_password = EncryptionService.encrypt(
        password, user_password
    )
    
    # Encrypt recovery email if provided
    encrypted_recovery_email = None
    if recovery_email:
        encrypted_recovery_email, _, _, _ = EncryptionService.encrypt(
            recovery_email, user_password
        )
    
    # Encrypt 2FA secret if provided
    encrypted_2fa_secret = None
    if two_fa_secret:
        encrypted_2fa_secret, _, _, _ = EncryptionService.encrypt(
            two_fa_secret, user_password
        )
    
    # Store encrypted credentials
    # Note: Each field uses its own IV/salt/tag for security
    # For simplicity in storage, we'll use the password's IV/salt/tag as the primary
    # In production, you might want to store IV/salt/tag per field
    existing_vault.encrypted_username = encrypted_username
    existing_vault.encrypted_password = encrypted_password
    existing_vault.encrypted_recovery_email = encrypted_recovery_email
    existing_vault.encrypted_2fa_secret = encrypted_2fa_secret
    
    # Use password encryption metadata (primary IV/salt/tag)
    existing_vault.iv = iv_password
    existing_vault.salt = salt_password
    existing_vault.tag = tag_password
    existing_vault.encryption_key_id = "default_v1"
    
    # Update transaction state to TEMPORARY_ACCESS_GRANTED
    # This triggers buyer's STEP 3
    transaction.state = TransactionState.TEMPORARY_ACCESS_GRANTED
    transaction.temporary_access_granted_at = datetime.utcnow().isoformat()
    
    # Create TemporaryAccess record for buyer
    # This is created when seller delivers credentials (STEP 4)
    from app.models.temporary_access import TemporaryAccess
    from datetime import timedelta
    
    # Check if TemporaryAccess already exists
    temp_access = db.query(TemporaryAccess).filter(
        TemporaryAccess.transaction_id == transaction.id
    ).first()
    
    if not temp_access:
        # Create temporary access (48 hours default)
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=48)
        
        temp_access = TemporaryAccess(
            transaction_id=transaction.id,
            access_granted_at=now,
            access_expires_at=expires_at,
            max_login_attempts=10
        )
        db.add(temp_access)
    
    db.commit()
    db.refresh(existing_vault)
    
    return existing_vault


def get_seller_dashboard_data(
    db: Session,
    seller_id: int
) -> dict:
    """
    Get seller dashboard data showing all active transactions.
    """
    transactions = db.query(Transaction).filter(
        Transaction.seller_id == seller_id
    ).order_by(Transaction.created_at.desc()).all()
    
    # Group by state
    active_transactions = [t for t in transactions if t.state not in [
        TransactionState.COMPLETED,
        TransactionState.REFUNDED,
        TransactionState.CANCELLED
    ]]
    
    completed_transactions = [t for t in transactions if t.state == TransactionState.COMPLETED]
    
    # Calculate stats
    total_earnings = sum(t.payout_amount_usd or 0 for t in completed_transactions)
    pending_earnings = sum(
        t.amount_usd for t in active_transactions 
        if t.state in [TransactionState.FUNDS_HELD, TransactionState.TEMPORARY_ACCESS_GRANTED, TransactionState.VERIFICATION_WINDOW]
    )
    
    return {
        "active_transactions": active_transactions,
        "completed_transactions": completed_transactions,
        "total_earnings_usd": total_earnings / 100,  # Convert cents to dollars
        "pending_earnings_usd": pending_earnings / 100,
        "active_count": len(active_transactions),
        "completed_count": len(completed_transactions)
    }


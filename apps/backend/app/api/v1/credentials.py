"""
Credential reveal API endpoint (one-time only).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_buyer
from app.models.user import User
from app.models.transaction import TransactionState
from app.models.credential_vault import CredentialVault
from app.crud import transaction as transaction_crud, listing as listing_crud
from app.schemas.credential_reveal import CredentialRevealRequest, CredentialRevealResponse
from app.core.encryption import EncryptionService
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip

router = APIRouter()


@router.post("/transactions/{transaction_id}/reveal", response_model=CredentialRevealResponse)
async def reveal_credentials(
    transaction_id: int,
    reveal_request: CredentialRevealRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Reveal credentials ONE-TIME ONLY.
    
    This endpoint:
    - Decrypts credentials in memory
    - Returns plaintext once
    - Marks credentials as revealed
    - Never logs or stores plaintext
    
    Requirements:
    - Transaction must be in CONTRACT_SIGNED or FUNDS_HELD state
    - Credentials must not have been revealed before
    - Buyer must provide correct password
    """
    # Get transaction
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Verify buyer owns this transaction
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reveal credentials for this transaction"
        )
    
    # Verify transaction state
    if transaction.state not in [TransactionState.CONTRACT_SIGNED, TransactionState.FUNDS_HELD]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Credentials can only be revealed when transaction is in CONTRACT_SIGNED or FUNDS_HELD state. Current state: {transaction.state.value}"
        )
    
    # Get listing and credentials
    listing = listing_crud.get_listing_by_id(db, transaction.listing_id)
    if not listing or not listing.credentials:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing or credentials not found"
        )
    
    credential_vault = listing.credentials
    
    # Check if already revealed
    if credential_vault.revealed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credentials have already been revealed. This is a one-time operation."
        )
    
    # Decrypt credentials in memory
    try:
        username = EncryptionService.decrypt(
            credential_vault.encrypted_username,
            credential_vault.iv,
            credential_vault.salt,
            credential_vault.tag,
            reveal_request.user_password
        )
        
        password = EncryptionService.decrypt(
            credential_vault.encrypted_password,
            credential_vault.iv,
            credential_vault.salt,
            credential_vault.tag,
            reveal_request.user_password
        )
        
        recovery_email = None
        if credential_vault.encrypted_recovery_email:
            recovery_email = EncryptionService.decrypt(
                credential_vault.encrypted_recovery_email,
                credential_vault.iv,
                credential_vault.salt,
                credential_vault.tag,
                reveal_request.user_password
            )
        
        two_fa_secret = None
        if credential_vault.encrypted_2fa_secret:
            two_fa_secret = EncryptionService.decrypt(
                credential_vault.encrypted_2fa_secret,
                credential_vault.iv,
                credential_vault.salt,
                credential_vault.tag,
                reveal_request.user_password
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Decryption failed: {str(e)}. Please verify your password is correct."
        )
    
    # Mark credentials as revealed (IMMEDIATELY - before returning response)
    now = datetime.utcnow()
    credential_vault.revealed_at = now
    credential_vault.revealed_to_user_id = current_user.id
    
    # Update transaction state and timestamp
    transaction = transaction_crud.update_transaction_state(
        db=db,
        transaction=transaction,
        new_state=TransactionState.CREDENTIALS_RELEASED
    )
    
    # Log event (DO NOT log plaintext credentials)
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.CREDENTIALS_REVEALED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "transaction_id": transaction_id,
            "listing_id": listing.id,
            "revealed_at": now.isoformat()
        },
        success=True
    )
    
    # Return plaintext credentials (ONE-TIME ONLY)
    return CredentialRevealResponse(
        username=username,
        password=password,
        recovery_email=recovery_email,
        two_fa_secret=two_fa_secret,
        revealed_at=now,
        warning="⚠️ CRITICAL: These credentials are shown ONCE. Save them securely immediately. They will never be shown again.",
        self_destruct_minutes=5
    )


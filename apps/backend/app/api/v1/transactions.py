"""
Transaction API endpoints for buyers.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_buyer
from app.models.user import User
from app.models.listing import ListingState
from app.models.transaction import TransactionState
from app.crud import transaction as transaction_crud, listing as listing_crud
from app.crud import catalog as catalog_crud
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionDetailResponse
from app.core.payment import PaystackService
from app.core.events import AuditLogger
from app.core.config import settings
from app.utils.request_utils import get_client_ip
import secrets
import string

router = APIRouter()


def generate_paystack_reference() -> str:
    """Generate unique Paystack reference"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(20))


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def initiate_purchase(
    request: Request,
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Initiate a purchase (create transaction and initialize Paystack payment).
    Only buyers can initiate purchases.
    """
    # Verify user is verified
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email and phone must be verified to make purchases"
        )
    
    # Get listing
    listing = listing_crud.get_listing_by_id(db, transaction_data.listing_id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Verify listing is approved
    if listing.state != ListingState.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only approved listings can be purchased"
        )
    
    # Check if listing already has a transaction
    existing_transaction = transaction_crud.get_transaction_by_listing_id(db, transaction_data.listing_id)
    if existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing already has an active transaction"
        )
    
    # Generate Paystack reference
    paystack_reference = generate_paystack_reference()
    
    # Create transaction
    try:
        transaction = transaction_crud.create_transaction(
            db=db,
            listing_id=transaction_data.listing_id,
            buyer_id=current_user.id,
            amount_usd=listing.price_usd,
            paystack_reference=paystack_reference
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Initialize Paystack payment
    try:
        paystack_service = PaystackService()
        payment_response = paystack_service.initialize_payment(
            email=current_user.email,
            amount=listing.price_usd,  # Amount in cents
            reference=paystack_reference,
            metadata={
                "transaction_id": transaction.id,
                "listing_id": listing.id,
                "buyer_id": current_user.id
            }
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_INITIATED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "listing_id": listing.id,
                "amount": listing.price_usd
            },
            success=True
        )
        
        # Return transaction with payment URL
        response = TransactionResponse.model_validate(transaction)
        # Note: In production, include payment authorization_url in response
        return response
        
    except Exception as e:
        # Rollback transaction on payment initialization failure
        db.delete(transaction)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize payment: {str(e)}"
        )


@router.get("", response_model=List[TransactionResponse])
async def get_my_transactions(
    state: TransactionState = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get current user's transactions"""
    transactions = transaction_crud.get_transactions_by_buyer(
        db=db,
        buyer_id=current_user.id,
        state=state,
        skip=skip,
        limit=limit
    )
    return transactions


@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get transaction details (only buyer can view their own)"""
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction"
        )
    
    return TransactionDetailResponse.model_validate(transaction)


@router.post("/{transaction_id}/confirm-access", response_model=TransactionResponse)
async def confirm_access(
    transaction_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Buyer confirms successful access to account.
    This triggers:
    - Manual capture of held funds
    - Transfer to seller (minus commission)
    - Listing marked as SOLD
    - Transaction marked as COMPLETED
    """
    # Get transaction
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to confirm access for this transaction"
        )
    
    # Verify transaction state
    if transaction.state != TransactionState.CREDENTIALS_RELEASED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Access can only be confirmed after credentials are released. Current state: {transaction.state.value}"
        )
    
    # Verify credentials were revealed
    listing = listing_crud.get_listing_by_id(db, transaction.listing_id)
    if not listing or not listing.credentials or not listing.credentials.revealed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credentials must be revealed before confirming access"
        )
    
    # Check if already confirmed
    if transaction.buyer_confirmed_access:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access has already been confirmed"
        )
    
    # Import payout service
    from app.core.payout import PayoutService
    from app.core.payment import PaystackService
    from app.crud import escrow_completion
    
    try:
        # Calculate commission and payout
        commission_usd, payout_amount_usd = PayoutService.calculate_commission(transaction.amount_usd)
        
        # Manual capture (charge authorization)
        paystack_service = PaystackService()
        capture_reference = f"CAPTURE_{transaction.paystack_reference}"
        
        capture_response = paystack_service.charge_authorization(
            authorization_code=transaction.paystack_authorization_code,
            email=current_user.email,
            amount=transaction.amount_usd,
            reference=capture_reference
        )
        
        if capture_response.get("status") != True:
            raise ValueError("Failed to capture funds from Paystack")
        
        # TODO: Create transfer recipient and initiate transfer
        # For now, we'll mark the transaction as ready for payout
        # In production, implement full transfer flow
        
        # Update transaction
        transaction.buyer_confirmed_access = True
        transaction.access_confirmed_at = datetime.utcnow().isoformat()
        transaction.commission_usd = commission_usd
        transaction.payout_amount_usd = payout_amount_usd
        transaction.payout_reference = capture_reference  # Placeholder
        
        # Update transaction state to COMPLETED
        transaction = transaction_crud.update_transaction_state(
            db=db,
            transaction=transaction,
            new_state=TransactionState.COMPLETED
        )
        
        # Mark listing as SOLD
        listing.state = ListingState.SOLD
        db.commit()
        db.refresh(transaction)
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_COMPLETED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction_id,
                "commission_usd": commission_usd,
                "payout_amount_usd": payout_amount_usd,
                "capture_reference": capture_reference
            },
            success=True
        )
        
        return TransactionResponse.model_validate(transaction)
        
    except Exception as e:
        # Rollback on error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete transaction: {str(e)}"
        )


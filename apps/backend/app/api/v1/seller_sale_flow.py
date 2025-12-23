"""
Step-locked seller sale flow endpoints.
Mirrors buyer purchase flow with seller protections.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_seller
from app.models.user import User
from app.models.transaction import Transaction, TransactionState
from app.crud import transaction as transaction_crud
from app.crud import seller_sale_flow as seller_flow_crud
from app.schemas.seller_sale_flow import (
    CredentialDeliveryRequest,
    SellerTransactionStatusResponse,
    SellerDashboardResponse
)
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip, get_user_agent

router = APIRouter()


@router.get("/sale/dashboard", response_model=SellerDashboardResponse)
async def get_seller_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Get seller dashboard with all transactions and earnings.
    """
    dashboard_data = seller_flow_crud.get_seller_dashboard_data(
        db=db,
        seller_id=current_user.id
    )
    
    # Convert transactions to response format
    active_responses = []
    for t in dashboard_data["active_transactions"]:
        active_responses.append(_transaction_to_seller_status(t, db))
    
    completed_responses = []
    for t in dashboard_data["completed_transactions"]:
        completed_responses.append(_transaction_to_seller_status(t, db))
    
    return SellerDashboardResponse(
        active_transactions=active_responses,
        completed_transactions=completed_responses,
        total_earnings_usd=dashboard_data["total_earnings_usd"],
        pending_earnings_usd=dashboard_data["pending_earnings_usd"],
        active_count=dashboard_data["active_count"],
        completed_count=dashboard_data["completed_count"]
    )


@router.get("/sale/transaction/{transaction_id}/status", response_model=SellerTransactionStatusResponse)
async def get_seller_transaction_status(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Get seller transaction status.
    
    Shows:
    - Current step and state
    - Payment confirmation status
    - Credential delivery status
    - Buyer verification status
    - Fund release status
    """
    try:
        transaction = seller_flow_crud.get_seller_transaction_status(
            db=db,
            transaction_id=transaction_id,
            seller_id=current_user.id
        )
        
        return _transaction_to_seller_status(transaction, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/sale/transaction/{transaction_id}/credentials/deliver", response_model=SellerTransactionStatusResponse)
async def step4_deliver_credentials(
    transaction_id: int,
    delivery_data: CredentialDeliveryRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    STEP 4: Secure Credential Delivery
    
    - Seller submits credentials via platform
    - Credentials are encrypted and stored
    - One-time encrypted submission
    - Access logging enabled
    - Credential change freeze activated
    
    Seller warning:
    "Do not alter account details after submission."
    """
    try:
        # Get transaction
        transaction = seller_flow_crud.get_seller_transaction_status(
            db=db,
            transaction_id=transaction_id,
            seller_id=current_user.id
        )
        
        # Deliver credentials
        credential_vault = seller_flow_crud.deliver_credentials(
            db=db,
            transaction=transaction,
            username=delivery_data.username,
            password=delivery_data.password,
            recovery_email=delivery_data.recovery_email,
            two_fa_secret=delivery_data.two_fa_secret,
            user_password=delivery_data.encryption_password
        )
        
        # Log event
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.CREDENTIALS_STORED,
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "transaction_id": transaction.id,
                "listing_id": transaction.listing_id,
                "step": 4,
                "credentials_delivered": True,
                "warning": "Seller has been warned not to alter account details after submission"
            },
            success=True
        )
        
        # Refresh transaction
        db.refresh(transaction)
        
        return _transaction_to_seller_status(transaction, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/sale/transaction/{transaction_id}/can-deliver")
async def check_can_deliver_credentials(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Check if seller can deliver credentials (STEP 4).
    
    Returns:
    - can_deliver: bool
    - reason: str (if cannot deliver)
    """
    try:
        transaction = seller_flow_crud.get_seller_transaction_status(
            db=db,
            transaction_id=transaction_id,
            seller_id=current_user.id
        )
        
        can_deliver, reason = seller_flow_crud.can_deliver_credentials(
            db=db,
            transaction=transaction
        )
        
        return {
            "can_deliver": can_deliver,
            "reason": reason,
            "current_state": transaction.state.value,
            "payment_confirmed": transaction.state == TransactionState.FUNDS_HELD
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


def _transaction_to_seller_status(transaction: Transaction, db: Session) -> SellerTransactionStatusResponse:
    """Convert transaction to seller status response"""
    # Check if credentials delivered
    credentials_delivered = False
    credentials_delivered_at = None
    if transaction.listing and transaction.listing.credentials:
        credentials_delivered = transaction.listing.credentials.revealed_at is not None
        if transaction.listing.credentials.revealed_at:
            credentials_delivered_at = transaction.listing.credentials.revealed_at.isoformat()
    
    # Check if can deliver credentials
    can_deliver, delivery_reason = seller_flow_crud.can_deliver_credentials(db, transaction)
    
    # Get verification deadline from temporary access
    verification_deadline = None
    if transaction.temporary_access and transaction.temporary_access.access_expires_at:
        verification_deadline = transaction.temporary_access.access_expires_at.isoformat()
    elif transaction.verification_deadline:
        verification_deadline = transaction.verification_deadline
    
    return SellerTransactionStatusResponse(
        transaction_id=transaction.id,
        listing_id=transaction.listing_id,
        buyer_id=transaction.buyer_id,  # In production, mask this
        current_step=_get_seller_step(transaction.state),
        current_state=transaction.state.value,
        amount_usd=transaction.amount_usd / 100,  # Convert cents to dollars
        funds_held=transaction.state in [TransactionState.FUNDS_HELD, TransactionState.TEMPORARY_ACCESS_GRANTED, TransactionState.VERIFICATION_WINDOW],
        payment_confirmed=transaction.state in [
            TransactionState.FUNDS_HELD,
            TransactionState.TEMPORARY_ACCESS_GRANTED,
            TransactionState.VERIFICATION_WINDOW,
            TransactionState.OWNERSHIP_AGREEMENT_PENDING,
            TransactionState.OWNERSHIP_AGREEMENT_SIGNED,
            TransactionState.FUNDS_RELEASE_PENDING,
            TransactionState.FUNDS_RELEASED,
            TransactionState.COMPLETED
        ],
        credentials_delivered=credentials_delivered,
        buyer_verified=transaction.account_verified if hasattr(transaction, 'account_verified') else False,
        ownership_signed=transaction.state in [
            TransactionState.OWNERSHIP_AGREEMENT_SIGNED,
            TransactionState.FUNDS_RELEASE_PENDING,
            TransactionState.FUNDS_RELEASED,
            TransactionState.COMPLETED
        ],
        funds_released=transaction.state in [
            TransactionState.FUNDS_RELEASED,
            TransactionState.COMPLETED
        ],
        can_deliver_credentials=can_deliver,
        delivery_reason=delivery_reason if not can_deliver else None,
        payment_confirmed_at=transaction.funds_held_at,
        credentials_delivered_at=credentials_delivered_at,
        verification_deadline=verification_deadline,
        funds_released_at=transaction.funds_released_at
    )


def _get_seller_step(state: TransactionState) -> int:
    """Get seller-facing step number based on transaction state"""
    step_map = {
        TransactionState.PURCHASE_INITIATED: 2,  # Buyer locked account
        TransactionState.PAYMENT_PENDING: 2,
        TransactionState.FUNDS_HELD: 3,  # Payment confirmed
        TransactionState.TEMPORARY_ACCESS_GRANTED: 4,  # Credentials delivered
        TransactionState.VERIFICATION_WINDOW: 5,  # Buyer verification period
        TransactionState.OWNERSHIP_AGREEMENT_PENDING: 5,
        TransactionState.OWNERSHIP_AGREEMENT_SIGNED: 6,  # Buyer acceptance
        TransactionState.FUNDS_RELEASE_PENDING: 6,
        TransactionState.FUNDS_RELEASED: 6,
        TransactionState.COMPLETED: 7,  # Post-transfer closure
        TransactionState.REFUNDED: 0,
        TransactionState.CANCELLED: 0,
        TransactionState.DISPUTED: 0,
    }
    return step_map.get(state, 0)


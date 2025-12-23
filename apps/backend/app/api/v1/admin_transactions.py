"""
Admin transaction management endpoints (Super Admin only).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.models.transaction import TransactionState
from app.crud import transaction as transaction_crud
from app.payment.crud import escrow_completion
from app.schemas.transaction import TransactionResponse
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip
from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.transaction import TransactionDetailResponse

router = APIRouter()


class DisputeActionRequest(BaseModel):
    """Schema for dispute actions"""
    reason: str = Field(..., min_length=10, description="Reason for action (required for audit)")


@router.post("/transactions/{transaction_id}/release", response_model=TransactionResponse)
async def force_release(
    transaction_id: int,
    action_request: DisputeActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Force release funds to seller (Super Admin override).
    Use only in dispute resolution scenarios.
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.state == TransactionState.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is already completed"
        )
    
    if transaction.state == TransactionState.REFUNDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot release a refunded transaction"
        )
    
    # Force release
    transaction = escrow_completion.force_release(
        db=db,
        transaction=transaction,
        reason=action_request.reason,
        admin_id=current_user.id
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.TRANSACTION_COMPLETED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "transaction_id": transaction_id,
            "action": "forced_release",
            "reason": action_request.reason
        },
        success=True
    )
    
    return TransactionResponse.model_validate(transaction)


@router.post("/transactions/{transaction_id}/refund", response_model=TransactionResponse)
async def process_refund(
    transaction_id: int,
    action_request: DisputeActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Process refund to buyer (Super Admin override).
    Use only in dispute resolution scenarios.
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.state == TransactionState.REFUNDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction is already refunded"
        )
    
    if transaction.state == TransactionState.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot refund a completed transaction. Use dispute resolution."
        )
    
    # Process refund
    transaction = escrow_completion.process_refund(
        db=db,
        transaction=transaction,
        reason=action_request.reason,
        admin_id=current_user.id
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.TRANSACTION_REFUNDED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "transaction_id": transaction_id,
            "action": "admin_refund",
            "reason": action_request.reason
        },
        success=True
    )
    
    return TransactionResponse.model_validate(transaction)


@router.get("/transactions", response_model=List[TransactionResponse])
async def list_all_transactions(
    state: Optional[TransactionState] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """List all transactions (Super Admin only)"""
    from app.models.transaction import Transaction
    
    # Get all transactions
    query = db.query(Transaction)
    if state:
        query = query.filter(Transaction.state == state)
    transactions = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return [TransactionResponse.model_validate(t) for t in transactions]


@router.get("/transactions/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction_details(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get full transaction details (Super Admin only)"""
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionDetailResponse.model_validate(transaction)


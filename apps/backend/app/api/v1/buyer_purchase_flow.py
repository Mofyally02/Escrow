"""
Step-locked buyer purchase flow endpoints.
Buyer can only proceed one step at a time.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_buyer
from app.models.user import User
from app.models.transaction import Transaction, TransactionState
from app.crud import transaction as transaction_crud
from app.crud import buyer_purchase_flow as purchase_flow_crud
from app.crud import listing as listing_crud
from app.schemas.buyer_purchase_flow import (
    PurchaseInitiateRequest,
    PaymentConfirmRequest,
    AccountVerificationRequest,
    OwnershipAgreementSignRequest,
    FundsReleaseRequest,
    TransactionStepResponse
)
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip, get_user_agent
from app.core.payment import PaystackService
import secrets
import string

router = APIRouter()


def generate_paystack_reference() -> str:
    """Generate unique Paystack reference"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(20))


@router.post("/purchase/initiate", response_model=TransactionStepResponse, status_code=status.HTTP_201_CREATED)
async def step1_initiate_purchase(
    request: Request,
    purchase_data: PurchaseInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 1: Initiate Secure Purchase
    
    - Buyer clicks "Purchase Account Securely"
    - Account is locked to buyer
    - Escrow transaction is created
    - Seller is notified
    """
    # Verify user is verified
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email and phone must be verified to make purchases"
        )
    
    try:
        # Create transaction and lock listing
        transaction = purchase_flow_crud.initiate_purchase(
            db=db,
            listing_id=purchase_data.listing_id,
            buyer_id=current_user.id
        )
        
        # Generate Paystack reference for payment
        paystack_reference = generate_paystack_reference()
        transaction.paystack_reference = paystack_reference
        db.commit()
        db.refresh(transaction)
        
        # Initialize Paystack payment
        listing = listing_crud.get_listing_by_id(db, purchase_data.listing_id)
        paystack_service = PaystackService()
        payment_response = paystack_service.initialize_payment(
            email=current_user.email,
            amount=listing.price_usd,
            reference=paystack_reference,
            metadata={
                "transaction_id": transaction.id,
                "listing_id": listing.id,
                "buyer_id": current_user.id
            }
        )
        
        # Extract authorization URL from Paystack response
        authorization_url = payment_response.get("data", {}).get("authorization_url")
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_INITIATED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "listing_id": purchase_data.listing_id,
                "step": 1
            },
            success=True
        )
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=1,
            current_state=transaction.state.value,
            can_proceed=True,
            next_step_available=True,
            step_requirements_met={"payment_required": True},
            verification_deadline=None,
            time_remaining_hours=None,
            payment_authorization_url=authorization_url,
            paystack_reference=paystack_reference
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/payment/confirm", response_model=TransactionStepResponse)
async def step2_confirm_payment(
    transaction_id: int,
    payment_data: PaymentConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 2: Make Escrow Payment
    
    - Buyer completes payment into escrow
    - Funds are securely held by platform
    - Payment receipt is generated
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Confirm payment and update state
        transaction = purchase_flow_crud.confirm_payment(
            db=db,
            transaction=transaction,
            paystack_reference=payment_data.paystack_reference,
            paystack_authorization_code=payment_data.paystack_authorization_code
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.FUNDS_HELD,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "step": 2,
                "paystack_reference": payment_data.paystack_reference
            },
            success=True
        )
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=2,
            current_state=transaction.state.value,
            can_proceed=True,
            next_step_available=True,
            step_requirements_met={"payment_confirmed": True},
            verification_deadline=None,
            time_remaining_hours=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/temporary-access", response_model=TransactionStepResponse)
async def step3_grant_temporary_access(
    transaction_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 3: Receive Limited Account Access
    
    - Seller has submitted credentials
    - Buyer receives temporary access
    - Access window is time-limited
    - Security controls are active
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Grant temporary access (48 hours default)
        temporary_access = purchase_flow_crud.grant_temporary_access(
            db=db,
            transaction=transaction,
            access_duration_hours=48
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.CREDENTIALS_RELEASED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "step": 3,
                "access_expires_at": temporary_access.access_expires_at.isoformat()
            },
            success=True
        )
        
        time_remaining = temporary_access.time_remaining_hours
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=3,
            current_state=transaction.state.value,
            can_proceed=True,
            next_step_available=True,
            step_requirements_met={"temporary_access_granted": True},
            verification_deadline=temporary_access.access_expires_at.isoformat(),
            time_remaining_hours=time_remaining
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/verification/start", response_model=TransactionStepResponse)
async def step4_start_verification(
    transaction_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 4: Start Account Validation & Verification Window
    
    - Buyer can verify account authenticity
    - Buyer can verify account functionality
    - Time limit is set (e.g., 48 hours)
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Start verification window (48 hours default)
        transaction = purchase_flow_crud.start_verification_window(
            db=db,
            transaction=transaction,
            verification_duration_hours=48
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_INITIATED,  # TODO: Add VERIFICATION_WINDOW_STARTED action
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "step": 4,
                "verification_deadline": transaction.verification_deadline
            },
            success=True
        )
        
        deadline = datetime.fromisoformat(transaction.verification_deadline.replace('Z', '+00:00'))
        now = datetime.utcnow()
        time_remaining = (deadline - now).total_seconds() / 3600.0
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=4,
            current_state=transaction.state.value,
            can_proceed=True,
            next_step_available=True,
            step_requirements_met={"verification_window_started": True},
            verification_deadline=transaction.verification_deadline,
            time_remaining_hours=time_remaining
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/verification/verify", response_model=TransactionStepResponse)
async def step4_verify_account(
    transaction_id: int,
    verification_data: AccountVerificationRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 4: Buyer verifies account
    
    - Buyer confirms account is valid
    - Can proceed to ownership agreement
    - Or open dispute if invalid
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Verify account
        transaction = purchase_flow_crud.verify_account(
            db=db,
            transaction=transaction,
            verified=verification_data.verified
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_COMPLETED,  # TODO: Add ACCOUNT_VERIFIED action
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "step": 4,
                "verified": verification_data.verified,
                "notes": verification_data.verification_notes
            },
            success=True
        )
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=transaction.get_current_step(),
            current_state=transaction.state.value,
            can_proceed=verification_data.verified,
            next_step_available=verification_data.verified,
            step_requirements_met={"account_verified": verification_data.verified},
            verification_deadline=transaction.verification_deadline,
            time_remaining_hours=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/ownership-agreement/sign", response_model=TransactionStepResponse)
async def step5_sign_ownership_agreement(
    transaction_id: int,
    sign_data: OwnershipAgreementSignRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 5: Ownership Acceptance Agreement
    
    - Buyer signs binding Ownership Transfer Agreement
    - Must tick all acknowledgment checkboxes
    - Must enter full legal name (validated against profile)
    - Digital signature is time-stamped and hashed
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Get or create ownership agreement
        from app.models.ownership_agreement import OwnershipAgreement
        agreement = db.query(OwnershipAgreement).filter(
            OwnershipAgreement.transaction_id == transaction.id
        ).first()
        
        if not agreement:
            # Generate agreement content
            from app.core.pdf_generator import PDFContractGenerator
            agreement_content = f"""
# OWNERSHIP TRANSFER AGREEMENT

**Transaction ID:** {transaction.id}
**Listing:** {transaction.listing.title}
**Platform:** {transaction.listing.platform}
**Purchase Price:** ${transaction.amount_usd / 100:.2f}

## OWNERSHIP TRANSFER ACKNOWLEDGMENT

By signing this agreement, the Buyer acknowledges:

1. **Account Verification**: I have verified the account and confirm it is authentic and functional.
2. **Ownership Acceptance**: I accept full ownership of the account and all associated rights and responsibilities.
3. **Risk Assumption**: I accept all risks associated with account ownership, including but not limited to platform policy violations, account suspension, or termination.
4. **Platform Liability**: I understand that Escrow platform liability ends upon fund release, and I will not hold Escrow responsible for any account-related issues after transfer.

**Buyer Signature:** {sign_data.buyer_full_name}
**Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
            agreement = purchase_flow_crud.create_ownership_agreement(
                db=db,
                transaction=transaction,
                agreement_content=agreement_content
            )
        
        # Sign agreement
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        agreement = purchase_flow_crud.sign_ownership_agreement(
            db=db,
            transaction=transaction,
            buyer_full_name=sign_data.buyer_full_name,
            ip_address=ip_address,
            user_agent=user_agent,
            verified_account=sign_data.verified_account,
            accepts_ownership=sign_data.accepts_ownership,
            accepts_risks=sign_data.accepts_risks,
            platform_liability_ends=sign_data.platform_liability_ends
        )
        
        # Log event
        AuditLogger.log_event(
            db=db,
            action=AuditAction.CONTRACT_SIGNED,
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "transaction_id": transaction.id,
                "step": 5,
                "agreement_signed": True,
                "signature_hash": agreement.signature_hash
            },
            success=True
        )
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=5,
            current_state=transaction.state.value,
            can_proceed=True,
            next_step_available=True,
            step_requirements_met={"agreement_signed": True},
            verification_deadline=None,
            time_remaining_hours=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/purchase/{transaction_id}/funds/release", response_model=TransactionStepResponse)
async def step6_request_funds_release(
    transaction_id: int,
    release_data: FundsReleaseRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    STEP 6: Final Confirmation & Fund Release
    
    - Buyer confirms ownership and requests fund release
    - Agreement is locked and archived
    - Funds are released to seller
    - Ownership is marked complete
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    try:
        # Request funds release
        transaction = purchase_flow_crud.request_funds_release(
            db=db,
            transaction=transaction
        )
        
        # Calculate commission and payout
        from app.core.payout import PayoutService
        commission_usd, payout_amount_usd = PayoutService.calculate_commission(transaction.amount_usd)
        
        # TODO: Process actual payout via Paystack transfer
        # For now, we'll use a placeholder reference
        # In production, this would call Paystack transfer API
        payout_reference = f"PAYOUT_{transaction.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Release funds
        transaction = purchase_flow_crud.release_funds(
            db=db,
            transaction=transaction,
            payout_reference=payout_reference,
            commission_usd=commission_usd,
            payout_amount_usd=payout_amount_usd
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.TRANSACTION_COMPLETED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "transaction_id": transaction.id,
                "step": 6,
                "funds_released": True,
                "payout_reference": payout_reference
            },
            success=True
        )
        
        return TransactionStepResponse(
            transaction_id=transaction.id,
            current_step=7,
            current_state=transaction.state.value,
            can_proceed=False,
            next_step_available=False,
            step_requirements_met={"transaction_completed": True},
            verification_deadline=None,
            time_remaining_hours=None
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/purchase/{transaction_id}/status", response_model=TransactionStepResponse)
async def get_purchase_status(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """
    Get current purchase status and step information.
    """
    transaction = transaction_crud.get_transaction_by_id(db, transaction_id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.buyer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized for this transaction"
        )
    
    # Get temporary access if exists
    time_remaining = None
    verification_deadline = transaction.verification_deadline
    
    if transaction.temporary_access:
        time_remaining = transaction.temporary_access.time_remaining_hours
        if transaction.temporary_access.access_expires_at:
            verification_deadline = transaction.temporary_access.access_expires_at.isoformat()
    
    # Determine if can proceed
    can_proceed = transaction.can_proceed_to_next_step()
    current_step = transaction.get_current_step()
    
    # Determine next step availability
    next_step_available = transaction.state not in [
        TransactionState.COMPLETED,
        TransactionState.REFUNDED,
        TransactionState.CANCELLED
    ]
    
    return TransactionStepResponse(
        transaction_id=transaction.id,
        current_step=current_step,
        current_state=transaction.state.value,
        can_proceed=can_proceed,
        next_step_available=next_step_available,
        step_requirements_met={},  # TODO: Implement step requirement checking
        verification_deadline=verification_deadline,
        time_remaining_hours=time_remaining
    )


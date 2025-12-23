"""
Paystack webhook handler with signature verification.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.core.database import get_db
from app.core.payment import PaystackService
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.crud import transaction as transaction_crud
from app.models.transaction import TransactionState
from app.models.payment_event import PaymentEventType
from app.utils.request_utils import get_client_ip

router = APIRouter()


@router.post("")
async def handle_paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None, alias="X-Paystack-Signature"),
    db: Session = Depends(get_db)
):
    """
    Handle Paystack webhook events.
    Verifies signature and processes payment events.
    """
    # Get raw body
    body = await request.body()
    body_str = body.decode('utf-8')
    
    # Verify signature
    if not x_paystack_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Paystack-Signature header"
        )
    
    paystack_service = PaystackService()
    signature_valid = paystack_service.verify_webhook_signature(body_str, x_paystack_signature)
    
    if not signature_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )
    
    # Parse webhook payload
    try:
        payload = json.loads(body_str)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
    
    # Parse event
    event_data = paystack_service.parse_webhook_event(payload)
    event_type = event_data.get("event_type")
    reference = event_data.get("reference")
    
    # Find transaction by reference
    transaction = None
    if reference:
        transaction = db.query(transaction_crud.Transaction).filter(
            transaction_crud.Transaction.paystack_reference == reference
        ).first()
    
    # Map Paystack event to PaymentEventType
    event_type_map = {
        "charge.success": PaymentEventType.CHARGE_SUCCESS,
        "charge.failed": PaymentEventType.CHARGE_FAILED,
        "transfer.success": PaymentEventType.TRANSFER_SUCCESS,
        "transfer.failed": PaymentEventType.TRANSFER_FAILED,
        "authorization": PaymentEventType.AUTHORIZATION,
        "refund": PaymentEventType.REFUND
    }
    
    payment_event_type = event_type_map.get(event_type)
    if not payment_event_type:
        # Unknown event type, but still log it
        payment_event_type = PaymentEventType.CHARGE_SUCCESS
    
    # Create payment event record
    payment_event = transaction_crud.create_payment_event(
        db=db,
        transaction_id=transaction.id if transaction else None,
        event_type=payment_event_type,
        payload=body_str,
        paystack_event_id=payload.get("id"),
        paystack_reference=reference,
        signature_verified=True
    )
    
    # Process event based on type
    if transaction:
        if event_type == "charge.success" and transaction.state in [TransactionState.PURCHASE_INITIATED, TransactionState.PAYMENT_PENDING]:
            # Funds authorized and held
            authorization_code = event_data.get("authorization_code")
            transaction = transaction_crud.update_transaction_state(
                db=db,
                transaction=transaction,
                new_state=TransactionState.FUNDS_HELD,
                paystack_authorization_code=authorization_code
            )
            
            # Mark event as processed
            payment_event.processed = True
            payment_event.processed_at = transaction.funds_held_at
            db.commit()
            
            # Log event
            AuditLogger.log_event(
                db=db,
                action=AuditAction.FUNDS_HELD,
                user_id=transaction.buyer_id,
                ip_address=get_client_ip(request),
                details={
                    "transaction_id": transaction.id,
                    "amount": transaction.amount_usd,
                    "reference": reference
                },
                success=True
            )
    
    return {"status": "success", "message": "Webhook processed"}


"""
User legal document acknowledgment endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from app.models.legal_document import DocumentType
from app.crud import user_legal_acknowledgment as acknowledgment_crud
from app.crud import legal_document as legal_document_crud
from app.schemas.legal_document import UserAcknowledgmentRequest, UserAcknowledgmentResponse
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip, get_user_agent

router = APIRouter()


@router.post("/acknowledge", response_model=UserAcknowledgmentResponse)
async def acknowledge_legal_document(
    request: Request,
    acknowledgment_data: UserAcknowledgmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge a legal document.
    User must be authenticated.
    """
    # Verify document exists
    document = legal_document_crud.get_legal_document_by_id(db, acknowledgment_data.document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    # Validate signature name matches user profile
    signed_name = acknowledgment_data.signed_by_name.strip()
    user_full_name = (current_user.full_name or "").strip()
    
    if user_full_name and signed_name.lower() != user_full_name.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signature name must match your registered full name. Expected: {user_full_name}, Provided: {signed_name}"
        )
    
    # Generate signature hash
    import hashlib
    from datetime import datetime
    signature_string = f"{signed_name}:{current_user.id}:{acknowledgment_data.document_id}:{document.version}:{datetime.utcnow().isoformat()}"
    signature_hash = hashlib.sha256(signature_string.encode('utf-8')).hexdigest()
    
    # Create acknowledgment
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    acknowledgment = acknowledgment_crud.create_user_acknowledgment(
        db=db,
        user_id=current_user.id,
        document_id=acknowledgment_data.document_id,
        ip_address=ip_address,
        user_agent=user_agent,
        signed_by_name=signed_name,
        signature_hash=signature_hash
    )
    
    # Log event
    AuditLogger.log_event(
        db=db,
        action=AuditAction.LEGAL_DOCUMENT_ACKNOWLEDGED,
        user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        details={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "document_version": document.version,
            "title": document.title
        },
        success=True
    )
    
    return UserAcknowledgmentResponse(
        user_id=current_user.id,
        document_id=document.id,
        acknowledged_at=acknowledgment.acknowledged_at,
        document_version=document.version,
        document_title=document.title,
        signed_by_name=acknowledgment.signed_by_name,
        signature_hash=acknowledgment.signature_hash
    )


@router.get("/check/{document_type}")
async def check_acknowledgment_status(
    document_type: DocumentType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has acknowledged the current version of a document type.
    Returns acknowledgment status.
    """
    has_acknowledged = acknowledgment_crud.has_user_acknowledged_current(
        db=db,
        user_id=current_user.id,
        document_type=document_type.value
    )
    
    current_doc = legal_document_crud.get_current_document_by_type(db, document_type)
    
    return {
        "has_acknowledged": has_acknowledged,
        "current_document": {
            "id": current_doc.id if current_doc else None,
            "version": current_doc.version if current_doc else None,
            "title": current_doc.title if current_doc else None
        } if current_doc else None
    }


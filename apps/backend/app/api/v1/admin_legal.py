"""
Admin endpoints for managing legal documents.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_super_admin
from app.models.user import User
from app.models.legal_document import LegalDocument, DocumentType
from app.crud import legal_document as legal_document_crud
from app.schemas.legal_document import (
    LegalDocumentCreate,
    LegalDocumentUpdate,
    LegalDocumentResponse,
    LegalDocumentPublishRequest
)
from app.core.events import AuditLogger
from app.models.audit_log import AuditAction
from app.utils.request_utils import get_client_ip

router = APIRouter()


@router.get("", response_model=List[LegalDocumentResponse])
async def get_all_legal_documents_admin(
    document_type: Optional[DocumentType] = None,
    current_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Get all legal documents (admin view).
    Super Admin only.
    """
    documents = legal_document_crud.get_all_legal_documents(
        db=db,
        document_type=document_type,
        current_only=current_only,
        skip=skip,
        limit=limit
    )
    return documents


@router.get("/{document_id}", response_model=LegalDocumentResponse)
async def get_legal_document_admin(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get a specific legal document by ID (admin view)"""
    document = legal_document_crud.get_legal_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    return document


@router.post("", response_model=LegalDocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_legal_document(
    request: Request,
    document_data: LegalDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Create a new legal document.
    Super Admin only.
    """
    document = legal_document_crud.create_legal_document(
        db=db,
        document_data=document_data,
        published_by_id=None  # Will be set when published
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.LEGAL_DOCUMENT_CREATED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "title": document.title,
            "version": document.version
        },
        success=True
    )
    
    return document


@router.patch("/{document_id}", response_model=LegalDocumentResponse)
async def update_legal_document(
    document_id: int,
    document_data: LegalDocumentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Update a legal document.
    Super Admin only.
    Cannot update if document is current (must create new version).
    """
    document = legal_document_crud.get_legal_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    if document.is_current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update current document. Create a new version instead."
        )
    
    updated_document = legal_document_crud.update_legal_document(
        db=db,
        document=document,
        document_data=document_data
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.LEGAL_DOCUMENT_UPDATED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "title": document.title
        },
        success=True
    )
    
    return updated_document


@router.post("/{document_id}/publish", response_model=LegalDocumentResponse)
async def publish_legal_document(
    document_id: int,
    publish_request: LegalDocumentPublishRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Publish a legal document as the current version.
    Automatically unpublishes previous version of the same type.
    Super Admin only.
    """
    document = legal_document_crud.get_legal_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    # Get next version if not provided
    new_version = publish_request.version
    if not new_version:
        new_version = legal_document_crud.get_next_version(db, document.document_type)
    
    published_document = legal_document_crud.publish_legal_document(
        db=db,
        document=document,
        published_by_id=current_user.id,
        new_version=new_version
    )
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_event(
        db=db,
        action=AuditAction.LEGAL_DOCUMENT_PUBLISHED,
        user_id=current_user.id,
        ip_address=ip_address,
        details={
            "document_id": document.id,
            "document_type": document.document_type.value,
            "title": document.title,
            "version": published_document.version
        },
        success=True
    )
    
    return published_document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_legal_document(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    Delete a legal document.
    Cannot delete if document is current (must unpublish first).
    Super Admin only.
    """
    document = legal_document_crud.get_legal_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    try:
        legal_document_crud.delete_legal_document(db, document)
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_event(
            db=db,
            action=AuditAction.LEGAL_DOCUMENT_DELETED,
            user_id=current_user.id,
            ip_address=ip_address,
            details={
                "document_id": document.id,
                "document_type": document.document_type.value,
                "title": document.title
            },
            success=True
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


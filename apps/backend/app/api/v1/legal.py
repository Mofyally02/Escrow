"""
Public endpoints for legal documents.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.legal_document import DocumentType
from app.crud import legal_document as legal_document_crud
from app.schemas.legal_document import (
    LegalDocumentPublicResponse,
    LegalDocumentListResponse
)
from app.utils.markdown_renderer import markdown_to_html_with_library

router = APIRouter()


@router.get("", response_model=List[LegalDocumentListResponse])
async def get_current_legal_documents(
    db: Session = Depends(get_db)
):
    """
    Get all current legal documents (public).
    Returns list of all published legal documents.
    """
    documents = legal_document_crud.get_current_legal_documents(db)
    return documents


@router.get("/{slug}", response_model=LegalDocumentPublicResponse)
async def get_legal_document_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """
    Get a legal document by slug (public).
    Returns HTML-rendered content.
    """
    document = legal_document_crud.get_legal_document_by_slug(db, slug, current_only=True)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Legal document not found"
        )
    
    # Render markdown to HTML
    content_html = markdown_to_html_with_library(document.content_markdown, library="markdown2")
    
    return LegalDocumentPublicResponse(
        id=document.id,
        title=document.title,
        slug=document.slug,
        document_type=document.document_type,
        content_html=content_html,
        version=document.version,
        published_at=document.published_at,
        updated_at=document.updated_at,
        effective_date=document.published_at or document.created_at
    )


@router.get("/{document_type}/current", response_model=LegalDocumentPublicResponse)
async def get_current_document_by_type(
    document_type: DocumentType,
    db: Session = Depends(get_db)
):
    """
    Get current document by type (public).
    Direct access by document type (e.g., /legal/terms_of_service/current).
    """
    document = legal_document_crud.get_current_document_by_type(db, document_type)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No current {document_type.value} document found"
        )
    
    # Render markdown to HTML
    content_html = markdown_to_html_with_library(document.content_markdown, library="markdown2")
    
    return LegalDocumentPublicResponse(
        id=document.id,
        title=document.title,
        slug=document.slug,
        document_type=document.document_type,
        content_html=content_html,
        version=document.version,
        published_at=document.published_at,
        updated_at=document.updated_at,
        effective_date=document.published_at or document.created_at
    )


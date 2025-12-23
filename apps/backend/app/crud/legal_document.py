"""
CRUD operations for legal documents.
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime
from app.models.legal_document import LegalDocument, DocumentType
from app.schemas.legal_document import LegalDocumentCreate, LegalDocumentUpdate


def get_legal_document_by_id(db: Session, document_id: int) -> Optional[LegalDocument]:
    """Get legal document by ID"""
    return db.query(LegalDocument).filter(LegalDocument.id == document_id).first()


def get_legal_document_by_slug(db: Session, slug: str, current_only: bool = True) -> Optional[LegalDocument]:
    """Get legal document by slug"""
    query = db.query(LegalDocument).filter(LegalDocument.slug == slug)
    if current_only:
        query = query.filter(LegalDocument.is_current == True)
    return query.first()


def get_current_document_by_type(db: Session, document_type: DocumentType) -> Optional[LegalDocument]:
    """Get current document by type"""
    return db.query(LegalDocument).filter(
        and_(
            LegalDocument.document_type == document_type,
            LegalDocument.is_current == True
        )
    ).first()


def get_all_legal_documents(
    db: Session,
    document_type: Optional[DocumentType] = None,
    current_only: bool = False,
    skip: int = 0,
    limit: int = 100
) -> List[LegalDocument]:
    """Get all legal documents with optional filters"""
    query = db.query(LegalDocument)
    
    if document_type:
        query = query.filter(LegalDocument.document_type == document_type)
    
    if current_only:
        query = query.filter(LegalDocument.is_current == True)
    
    return query.order_by(LegalDocument.created_at.desc()).offset(skip).limit(limit).all()


def get_current_legal_documents(db: Session) -> List[LegalDocument]:
    """Get all current legal documents"""
    return db.query(LegalDocument).filter(LegalDocument.is_current == True).all()


def create_legal_document(
    db: Session,
    document_data: LegalDocumentCreate,
    published_by_id: Optional[int] = None
) -> LegalDocument:
    """Create a new legal document"""
    # Generate slug if not provided
    slug = document_data.slug
    if not slug:
        slug = document_data.title.lower().replace(' ', '-')
        slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    # Ensure slug is unique
    existing = db.query(LegalDocument).filter(LegalDocument.slug == slug).first()
    if existing:
        slug = f"{slug}-{datetime.utcnow().strftime('%Y%m%d')}"
    
    document = LegalDocument(
        title=document_data.title,
        slug=slug,
        document_type=document_data.document_type,
        content_markdown=document_data.content_markdown,
        version=document_data.version,
        is_current=False,  # New documents are not current until published
        published_by_id=published_by_id
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document


def update_legal_document(
    db: Session,
    document: LegalDocument,
    document_data: LegalDocumentUpdate
) -> LegalDocument:
    """Update a legal document"""
    if document_data.title is not None:
        document.title = document_data.title
    if document_data.content_markdown is not None:
        document.content_markdown = document_data.content_markdown
    if document_data.version is not None:
        document.version = document_data.version
    
    db.commit()
    db.refresh(document)
    
    return document


def publish_legal_document(
    db: Session,
    document: LegalDocument,
    published_by_id: int,
    new_version: Optional[str] = None
) -> LegalDocument:
    """
    Publish a legal document as the current version.
    Automatically unpublishes previous version of the same type.
    """
    # Unpublish previous current document of the same type
    previous_current = get_current_document_by_type(db, document.document_type)
    if previous_current and previous_current.id != document.id:
        previous_current.is_current = False
        db.add(previous_current)
    
    # Update version if provided
    if new_version:
        document.version = new_version
    
    # Publish this document
    document.is_current = True
    document.published_at = datetime.utcnow()
    document.published_by_id = published_by_id
    
    db.commit()
    db.refresh(document)
    
    return document


def delete_legal_document(db: Session, document: LegalDocument) -> None:
    """Delete a legal document (only if not current)"""
    if document.is_current:
        raise ValueError("Cannot delete current document. Unpublish it first.")
    
    db.delete(document)
    db.commit()


def get_next_version(db: Session, document_type: DocumentType) -> str:
    """Get the next version number for a document type"""
    current = get_current_document_by_type(db, document_type)
    if not current:
        return "1.0"
    
    try:
        # Try to parse version as float and increment
        version_parts = current.version.split('.')
        major = int(version_parts[0])
        minor = int(version_parts[1]) if len(version_parts) > 1 else 0
        return f"{major}.{minor + 1}"
    except (ValueError, IndexError):
        # If version format is unexpected, just append .1
        return f"{current.version}.1"


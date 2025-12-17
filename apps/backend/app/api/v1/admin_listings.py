"""
Admin moderation endpoints for listings.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.listing import Listing, ListingState
from app.crud import listing as listing_crud
from app.schemas.listing import (
    ListingResponse,
    ListingDetailResponse,
    ListingStateChangeRequest
)
from app.core.events import AuditLogger
from app.core.config import settings
from app.utils.request_utils import get_client_ip, get_user_agent

router = APIRouter()


@router.get("", response_model=List[ListingDetailResponse])
async def get_listings_for_review(
    request: Request,
    state: Optional[ListingState] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get listings for admin review.
    Can filter by state.
    """
    listings = listing_crud.get_listings_for_admin(
        db=db,
        state=state,
        skip=skip,
        limit=limit
    )
    
    # Add proof count to each listing
    result = []
    for listing in listings:
        proofs = listing_crud.get_listing_proofs(db, listing.id)
        detail = ListingDetailResponse.model_validate(listing)
        detail.proof_count = len(proofs)
        result.append(detail)
    
    return result


@router.get("/{listing_id}", response_model=ListingDetailResponse)
async def get_listing_details(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get full listing details for admin review"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Log admin view
    ip_address = get_client_ip(request)
    AuditLogger.log_admin_review_started(db, current_user.id, listing_id, ip_address)
    
    # Get proof count
    proofs = listing_crud.get_listing_proofs(db, listing_id)
    
    detail = ListingDetailResponse.model_validate(listing)
    detail.proof_count = len(proofs)
    return detail


@router.post("/{listing_id}/approve", response_model=ListingResponse)
async def approve_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Approve listing (move to APPROVED state)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.state != ListingState.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing must be in UNDER_REVIEW state, currently {listing.state.value}"
        )
    
    try:
        approved_listing = listing_crud.approve_listing(
            db=db,
            listing=listing,
            admin_id=current_user.id
        )
        
        # Log events
        ip_address = get_client_ip(request)
        AuditLogger.log_listing_approved(db, current_user.id, listing_id, ip_address)
        AuditLogger.log_listing_state_changed(
            db,
            current_user.id,
            listing_id,
            ListingState.UNDER_REVIEW.value,
            ListingState.APPROVED.value,
            ip_address
        )
        
        return approved_listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{listing_id}/reject", response_model=ListingResponse)
async def reject_listing(
    listing_id: int,
    reason: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reject listing (move back to DRAFT with reason)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.state != ListingState.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing must be in UNDER_REVIEW state, currently {listing.state.value}"
        )
    
    if not reason or len(reason.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason must be at least 10 characters"
        )
    
    try:
        rejected_listing = listing_crud.reject_listing(
            db=db,
            listing=listing,
            admin_id=current_user.id,
            reason=reason.strip()
        )
        
        # Log events
        ip_address = get_client_ip(request)
        AuditLogger.log_listing_rejected(db, current_user.id, listing_id, reason, ip_address)
        AuditLogger.log_listing_state_changed(
            db,
            current_user.id,
            listing_id,
            ListingState.UNDER_REVIEW.value,
            ListingState.DRAFT.value,
            ip_address
        )
        
        return rejected_listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{listing_id}/request-info", response_model=ListingResponse)
async def request_more_info(
    listing_id: int,
    message: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Request more information from seller"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.state != ListingState.UNDER_REVIEW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing must be in UNDER_REVIEW state, currently {listing.state.value}"
        )
    
    if not message or len(message.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request message must be at least 10 characters"
        )
    
    # Store request in admin_notes
    if listing.admin_notes:
        listing.admin_notes += f"\n\n[Admin Request - {current_user.full_name}]: {message.strip()}"
    else:
        listing.admin_notes = f"[Admin Request - {current_user.full_name}]: {message.strip()}"
    
    db.commit()
    db.refresh(listing)
    
    # Log event
    ip_address = get_client_ip(request)
    AuditLogger.log_admin_request_info(db, current_user.id, listing_id, message, ip_address)
    
    return listing


@router.post("/{listing_id}/change-state", response_model=ListingResponse)
async def change_listing_state(
    listing_id: int,
    state_change: ListingStateChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Change listing state (admin only, with validation)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    old_state = listing.state
    
    try:
        updated_listing = listing_crud.change_listing_state(
            db=db,
            listing=listing,
            new_state=state_change.new_state,
            admin_id=current_user.id
        )
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_listing_state_changed(
            db,
            current_user.id,
            listing_id,
            old_state.value,
            state_change.new_state.value,
            ip_address
        )
        
        return updated_listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


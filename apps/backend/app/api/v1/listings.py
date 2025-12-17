"""
Seller listing submission endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user, require_seller
from app.models.user import User, Role
from app.models.listing import Listing, ListingState
from app.crud import listing as listing_crud
from app.schemas.listing import (
    ListingCreate,
    ListingUpdate,
    ListingResponse,
    ListingDetailResponse,
    ProofFileCreate,
    ProofFileResponse
)
from app.core.events import AuditLogger
from app.core.config import settings
from app.utils.request_utils import get_client_ip, get_user_agent

router = APIRouter()


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    request: Request,
    listing_data: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """
    Create a new listing with encrypted credentials.
    Only sellers can create listings.
    """
    # Rate limiting check
    limiter = request.app.state.limiter
    limiter.check_rate_limit(request, f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
    
    # Verify user is verified
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email and phone must be verified to create listings"
        )
    
    # Create listing with encrypted credentials
    try:
        listing = listing_crud.create_listing(
            db=db,
            seller_id=current_user.id,
            listing_data=listing_data,
            user_password=listing_data.user_password
        )
        
        # Log event
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
        AuditLogger.log_listing_created(db, current_user.id, listing.id, ip_address)
        AuditLogger.log_credentials_stored(db, current_user.id, listing.id, ip_address)
        
        return listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=List[ListingResponse])
async def get_my_listings(
    request: Request,
    state: ListingState = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Get current user's listings"""
    listings = listing_crud.get_listings_by_seller(
        db=db,
        seller_id=current_user.id,
        state=state,
        skip=skip,
        limit=limit
    )
    return listings


@router.get("/{listing_id}", response_model=ListingDetailResponse)
async def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Get listing details (only owner can view)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Only owner can view
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this listing"
        )
    
    # Get proof count
    proofs = listing_crud.get_listing_proofs(db, listing_id)
    
    response = ListingDetailResponse.from_orm(listing)
    response.proof_count = len(proofs)
    return response


@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: int,
    listing_data: ListingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Update listing (only in DRAFT state)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this listing"
        )
    
    try:
        updated_listing = listing_crud.update_listing(db, listing, listing_data)
        return updated_listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{listing_id}/submit", response_model=ListingResponse)
async def submit_listing(
    listing_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Submit listing for admin review"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this listing"
        )
    
    try:
        updated_listing = listing_crud.submit_listing_for_review(db, listing)
        
        # Log event
        ip_address = get_client_ip(request)
        AuditLogger.log_listing_submitted(db, current_user.id, listing_id, ip_address)
        AuditLogger.log_listing_state_changed(
            db,
            current_user.id,
            listing_id,
            ListingState.DRAFT.value,
            ListingState.UNDER_REVIEW.value,
            ip_address
        )
        
        return updated_listing
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{listing_id}/proofs", response_model=ProofFileResponse, status_code=status.HTTP_201_CREATED)
async def add_proof_file(
    listing_id: int,
    proof_data: ProofFileCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Add proof file to listing"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add proof to this listing"
        )
    
    # Only allow adding proofs to DRAFT or UNDER_REVIEW listings
    if listing.state not in [ListingState.DRAFT, ListingState.UNDER_REVIEW]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only add proofs to DRAFT or UNDER_REVIEW listings"
        )
    
    proof = listing_crud.add_proof_file(
        db=db,
        listing_id=listing_id,
        proof_type=proof_data.proof_type,
        file_url=proof_data.file_url,
        file_name=proof_data.file_name,
        file_size=proof_data.file_size,
        mime_type=proof_data.mime_type,
        description=proof_data.description
    )
    
    return proof


@router.get("/{listing_id}/proofs", response_model=List[ProofFileResponse])
async def get_listing_proofs(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Get all proof files for a listing"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view proofs for this listing"
        )
    
    proofs = listing_crud.get_listing_proofs(db, listing_id)
    return proofs


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_seller)
):
    """Delete listing (only in DRAFT state)"""
    listing = listing_crud.get_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this listing"
        )
    
    try:
        listing_crud.delete_listing(db, listing)
        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


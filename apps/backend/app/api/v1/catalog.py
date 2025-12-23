"""
Public catalog API endpoints (read-only).
Supports optional authentication to exclude seller's own listings.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.dependencies import get_current_user_optional
from app.models.user import User
from app.crud import catalog as catalog_crud
from app.schemas.catalog import CatalogListingResponse, CatalogListingDetailResponse

router = APIRouter()


@router.get("", response_model=List[CatalogListingResponse])
async def get_catalog(
    category: Optional[str] = Query(None, description="Filter by category"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    min_price: Optional[int] = Query(None, description="Minimum price in USD cents"),
    max_price: Optional[int] = Query(None, description="Maximum price in USD cents"),
    min_earnings: Optional[int] = Query(None, description="Minimum monthly earnings in USD cents"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get public catalog of approved listings.
    CRITICAL: Only APPROVED listings are returned.
    If user is authenticated, their own listings are excluded.
    No authentication required - public read-only endpoint.
    """
    # Exclude seller's own listings if authenticated
    exclude_seller_id = current_user.id if current_user else None
    
    listings = catalog_crud.get_approved_listings(
        db=db,
        category=category,
        platform=platform,
        min_price=min_price,
        max_price=max_price,
        min_earnings=min_earnings,
        exclude_seller_id=exclude_seller_id,  # CRITICAL: Seller never sees own listings
        skip=skip,
        limit=limit
    )
    return listings


@router.get("/{listing_id}", response_model=CatalogListingDetailResponse)
async def get_listing_details(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get public listing details.
    CRITICAL: Seller cannot view their own listing through this endpoint.
    No authentication required - public read-only endpoint.
    """
    # Exclude seller's own listings if authenticated
    exclude_seller_id = current_user.id if current_user else None
    
    listing = catalog_crud.get_approved_listing_by_id(
        db, 
        listing_id,
        exclude_seller_id=exclude_seller_id  # CRITICAL: Seller never sees own listings
    )
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found, not approved, or you are the seller"
        )
    
    # Get proof count
    proof_count = catalog_crud.get_listing_proof_count(db, listing_id)
    
    response = CatalogListingDetailResponse.model_validate(listing)
    response.proof_count = proof_count
    return response


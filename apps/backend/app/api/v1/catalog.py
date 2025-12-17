"""
Public catalog API endpoints (read-only, no authentication required).
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
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
    db: Session = Depends(get_db)
):
    """
    Get public catalog of approved listings.
    No authentication required - public read-only endpoint.
    """
    listings = catalog_crud.get_approved_listings(
        db=db,
        category=category,
        platform=platform,
        min_price=min_price,
        max_price=max_price,
        min_earnings=min_earnings,
        skip=skip,
        limit=limit
    )
    return listings


@router.get("/{listing_id}", response_model=CatalogListingDetailResponse)
async def get_listing_details(
    listing_id: int,
    db: Session = Depends(get_db)
):
    """
    Get public listing details.
    No authentication required - public read-only endpoint.
    """
    listing = catalog_crud.get_approved_listing_by_id(db, listing_id)
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not approved"
        )
    
    # Get proof count
    proof_count = catalog_crud.get_listing_proof_count(db, listing_id)
    
    response = CatalogListingDetailResponse.model_validate(listing)
    response.proof_count = proof_count
    return response


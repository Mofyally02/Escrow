"""
CRUD operations for public catalog (read-only).
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.listing import Listing, ListingState
from app.models.listing_proof import ListingProof


def get_approved_listings(
    db: Session,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_earnings: Optional[int] = None,
    exclude_seller_id: Optional[int] = None,  # Exclude seller's own listings
    skip: int = 0,
    limit: int = 100
) -> List[Listing]:
    """
    Get approved listings for public catalog with filters.
    CRITICAL: Only returns APPROVED listings, and excludes seller's own listings.
    
    Args:
        db: Database session
        category: Filter by category
        platform: Filter by platform
        min_price: Minimum price in USD cents
        max_price: Maximum price in USD cents
        min_earnings: Minimum monthly earnings in USD cents
        exclude_seller_id: Seller ID to exclude (seller never sees their own listings)
        skip: Pagination offset
        limit: Pagination limit
        
    Returns:
        List of approved listings (excluding seller's own if exclude_seller_id provided)
    """
    query = db.query(Listing).filter(Listing.state == ListingState.APPROVED)
    
    # CRITICAL: Exclude seller's own listings (defense-in-depth)
    if exclude_seller_id is not None:
        query = query.filter(Listing.seller_id != exclude_seller_id)
    
    # Apply filters
    if category:
        query = query.filter(Listing.category == category)
    if platform:
        query = query.filter(Listing.platform == platform)
    if min_price:
        query = query.filter(Listing.price_usd >= min_price)
    if max_price:
        query = query.filter(Listing.price_usd <= max_price)
    if min_earnings:
        query = query.filter(Listing.monthly_earnings >= min_earnings)
    
    return query.order_by(Listing.created_at.desc()).offset(skip).limit(limit).all()


def get_approved_listing_by_id(
    db: Session, 
    listing_id: int,
    exclude_seller_id: Optional[int] = None  # Exclude seller's own listings
) -> Optional[Listing]:
    """
    Get approved listing by ID (public view).
    CRITICAL: Seller cannot view their own listing through this endpoint.
    
    Args:
        db: Database session
        listing_id: Listing ID
        exclude_seller_id: Seller ID to exclude (seller never sees their own listings)
        
    Returns:
        Listing if approved and not owned by exclude_seller_id, None otherwise
    """
    query = db.query(Listing).filter(
        and_(
            Listing.id == listing_id,
            Listing.state == ListingState.APPROVED
        )
    )
    
    # CRITICAL: Exclude seller's own listings (defense-in-depth)
    if exclude_seller_id is not None:
        query = query.filter(Listing.seller_id != exclude_seller_id)
    
    return query.first()


def get_listing_proof_count(db: Session, listing_id: int) -> int:
    """Get proof count for a listing"""
    return db.query(ListingProof).filter(ListingProof.listing_id == listing_id).count()


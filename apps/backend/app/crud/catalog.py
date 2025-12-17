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
    skip: int = 0,
    limit: int = 100
) -> List[Listing]:
    """
    Get approved listings for public catalog with filters.
    
    Args:
        db: Database session
        category: Filter by category
        platform: Filter by platform
        min_price: Minimum price in USD cents
        max_price: Maximum price in USD cents
        min_earnings: Minimum monthly earnings in USD cents
        skip: Pagination offset
        limit: Pagination limit
        
    Returns:
        List of approved listings
    """
    query = db.query(Listing).filter(Listing.state == ListingState.APPROVED)
    
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


def get_approved_listing_by_id(db: Session, listing_id: int) -> Optional[Listing]:
    """
    Get approved listing by ID (public view).
    
    Args:
        db: Database session
        listing_id: Listing ID
        
    Returns:
        Listing if approved, None otherwise
    """
    return db.query(Listing).filter(
        and_(
            Listing.id == listing_id,
            Listing.state == ListingState.APPROVED
        )
    ).first()


def get_listing_proof_count(db: Session, listing_id: int) -> int:
    """Get proof count for a listing"""
    return db.query(ListingProof).filter(ListingProof.listing_id == listing_id).count()


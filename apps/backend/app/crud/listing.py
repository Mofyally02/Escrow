"""
CRUD operations for listings.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.listing import Listing, ListingState
from app.models.credential_vault import CredentialVault
from app.models.listing_proof import ListingProof
from app.schemas.listing import ListingCreate, ListingUpdate
from app.core.encryption import EncryptionService
from datetime import datetime


def get_listing_by_id(db: Session, listing_id: int) -> Optional[Listing]:
    """Get listing by ID with relationships loaded"""
    from sqlalchemy.orm import joinedload
    return db.query(Listing).options(
        joinedload(Listing.seller),
        joinedload(Listing.proofs)
    ).filter(Listing.id == listing_id).first()


def get_listings_by_seller(
    db: Session,
    seller_id: int,
    state: Optional[ListingState] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Listing]:
    """Get listings by seller with optional state filter"""
    query = db.query(Listing).filter(Listing.seller_id == seller_id)
    if state:
        query = query.filter(Listing.state == state)
    return query.offset(skip).limit(limit).all()


def get_listings_for_admin(
    db: Session,
    state: Optional[ListingState] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Listing]:
    """Get listings for admin review with seller relationship loaded"""
    from sqlalchemy.orm import joinedload
    query = db.query(Listing).options(joinedload(Listing.seller))
    if state:
        query = query.filter(Listing.state == state)
    return query.order_by(Listing.created_at.desc()).offset(skip).limit(limit).all()


def create_listing(
    db: Session,
    seller_id: int,
    listing_data: ListingCreate,
    user_password: str,
    initial_state: ListingState = ListingState.DRAFT
) -> Listing:
    """
    Create a new listing with encrypted credentials.
    
    Args:
        db: Database session
        seller_id: ID of the seller
        listing_data: Listing creation data
        user_password: User's password for encryption key derivation
        initial_state: Initial state of the listing (default: DRAFT)
        
    Returns:
        Created Listing object
    """
    # Create listing
    listing = Listing(
        seller_id=seller_id,
        title=listing_data.title,
        category=listing_data.category,
        platform=listing_data.platform,
        price_usd=listing_data.price_usd,
        description=listing_data.description,
        monthly_earnings=listing_data.monthly_earnings,
        account_age_months=listing_data.account_age_months,
        rating=listing_data.rating,
        state=initial_state
    )
    
    db.add(listing)
    db.flush()  # Get listing ID
    
    # Encrypt and store credentials
    encrypted_username, iv, salt, tag = EncryptionService.encrypt(
        listing_data.username,
        user_password
    )
    encrypted_password, iv_pwd, salt_pwd, tag_pwd = EncryptionService.encrypt(
        listing_data.password,
        user_password
    )
    
    encrypted_recovery_email = None
    iv_email = None
    salt_email = None
    tag_email = None
    if listing_data.recovery_email:
        encrypted_recovery_email, iv_email, salt_email, tag_email = EncryptionService.encrypt(
            listing_data.recovery_email,
            user_password
        )
    
    encrypted_2fa = None
    iv_2fa = None
    salt_2fa = None
    tag_2fa = None
    if listing_data.two_fa_secret:
        encrypted_2fa, iv_2fa, salt_2fa, tag_2fa = EncryptionService.encrypt(
            listing_data.two_fa_secret,
            user_password
        )
    
    # Store credentials (using username's IV/salt/tag for simplicity)
    # In production, you might want separate IV/salt/tag per field
    credential_vault = CredentialVault(
        listing_id=listing.id,
        encrypted_username=encrypted_username,
        encrypted_password=encrypted_password,
        encrypted_recovery_email=encrypted_recovery_email,
        encrypted_2fa_secret=encrypted_2fa,
        iv=iv,  # Using same IV for all fields (simplified)
        salt=salt,
        tag=tag,
        encryption_key_id=EncryptionService.generate_key_id()
    )
    
    db.add(credential_vault)
    db.commit()
    db.refresh(listing)
    
    return listing


def update_listing(
    db: Session,
    listing: Listing,
    listing_data: ListingUpdate
) -> Listing:
    """Update listing (only allowed in DRAFT state)"""
    if listing.state != ListingState.DRAFT:
        raise ValueError("Listing can only be updated in DRAFT state")
    
    update_data = listing_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)
    
    db.commit()
    db.refresh(listing)
    return listing


def submit_listing_for_review(db: Session, listing: Listing) -> Listing:
    """Submit listing for admin review"""
    if listing.state != ListingState.DRAFT:
        raise ValueError("Only DRAFT listings can be submitted for review")
    
    listing.state = ListingState.UNDER_REVIEW
    db.commit()
    db.refresh(listing)
    return listing


def approve_listing(
    db: Session,
    listing: Listing,
    admin_id: int
) -> Listing:
    """Approve listing (admin only)"""
    if listing.state != ListingState.UNDER_REVIEW:
        raise ValueError("Only listings under review can be approved")
    
    listing.state = ListingState.APPROVED
    listing.reviewed_by = admin_id
    listing.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)
    return listing


def reject_listing(
    db: Session,
    listing: Listing,
    admin_id: int,
    reason: str
) -> Listing:
    """Reject listing (admin only)"""
    if listing.state != ListingState.UNDER_REVIEW:
        raise ValueError("Only listings under review can be rejected")
    
    listing.state = ListingState.DRAFT
    listing.reviewed_by = admin_id
    listing.reviewed_at = datetime.utcnow()
    listing.rejection_reason = reason
    db.commit()
    db.refresh(listing)
    return listing


def change_listing_state(
    db: Session,
    listing: Listing,
    new_state: ListingState,
    admin_id: Optional[int] = None
) -> Listing:
    """Change listing state (with validation)"""
    if not listing.can_transition_to(new_state):
        raise ValueError(f"Cannot transition from {listing.state} to {new_state}")
    
    listing.state = new_state
    if admin_id:
        listing.reviewed_by = admin_id
        listing.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(listing)
    return listing


def add_proof_file(
    db: Session,
    listing_id: int,
    proof_type: str,
    file_url: str,
    file_name: str,
    file_size: Optional[int] = None,
    mime_type: Optional[str] = None,
    description: Optional[str] = None
) -> ListingProof:
    """Add proof file to listing"""
    proof = ListingProof(
        listing_id=listing_id,
        proof_type=proof_type,
        file_url=file_url,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        description=description
    )
    
    db.add(proof)
    db.commit()
    db.refresh(proof)
    return proof


def get_listing_proofs(db: Session, listing_id: int) -> List[ListingProof]:
    """Get all proof files for a listing"""
    return db.query(ListingProof).filter(ListingProof.listing_id == listing_id).all()


def delete_listing(db: Session, listing: Listing) -> bool:
    """Delete listing (only in DRAFT state)"""
    if listing.state != ListingState.DRAFT:
        raise ValueError("Only DRAFT listings can be deleted")
    
    db.delete(listing)
    db.commit()
    return True


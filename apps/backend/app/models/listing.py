from sqlalchemy import Column, String, Integer, Enum as SQLEnum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Timestamped
from app.models.currency import Currency


class ListingState(str, enum.Enum):
    """Listing state machine"""
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    RESERVED = "reserved"  # When buyer has paid into escrow
    SOLD = "sold"


class Listing(Timestamped):
    __tablename__ = "listings"
    
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Academic, Article, Translation, etc.
    platform = Column(String(100), nullable=False)  # Upwork, Fiverr, Freelancer, etc.
    price_usd = Column(Integer, nullable=False)  # Price in USD cents (legacy, for backward compatibility)
    currency = Column(SQLEnum(Currency, values_callable=lambda x: [e.value for e in x]), default=Currency.KSH, nullable=False, server_default=Currency.KSH.value)  # Listing currency (always KSH)
    price = Column(Integer, nullable=True)  # Price in KSH cents - nullable for migration
    
    description = Column(Text, nullable=True)
    state = Column(SQLEnum(ListingState, values_callable=lambda x: [e.value for e in x]), default=ListingState.DRAFT, nullable=False, index=True)
    
    # Account metadata
    monthly_earnings = Column(Integer, nullable=True)  # Monthly earnings in USD cents
    account_age_months = Column(Integer, nullable=True)
    rating = Column(String(10), nullable=True)  # e.g., "4.8", "5.0"
    
    # Admin moderation
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    seller = relationship("User", foreign_keys=[seller_id], back_populates="listings")
    credentials = relationship("CredentialVault", back_populates="listing", uselist=False, cascade="all, delete-orphan")
    proofs = relationship("ListingProof", back_populates="listing", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="listing")
    
    def can_transition_to(self, new_state: "ListingState") -> bool:
        """Check if state transition is valid"""
        transitions = {
            ListingState.DRAFT: [ListingState.UNDER_REVIEW],
            ListingState.UNDER_REVIEW: [ListingState.APPROVED, ListingState.DRAFT],
            ListingState.APPROVED: [ListingState.RESERVED],
            ListingState.RESERVED: [ListingState.SOLD],
            ListingState.SOLD: []  # Terminal state
        }
        return new_state in transitions.get(self.state, [])


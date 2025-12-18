from sqlalchemy import Column, Integer, ForeignKey, String, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class ProofType(str, enum.Enum):
    """Types of proof files"""
    EARNINGS_SCREENSHOT = "earnings_screenshot"
    ACCOUNT_DASHBOARD = "account_dashboard"
    REVIEW_SCREENSHOT = "review_screenshot"
    VERIFICATION_DOCUMENT = "verification_document"
    OTHER = "other"


class ListingProof(Timestamped):
    __tablename__ = "listing_proofs"
    
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, index=True)
    proof_type = Column(SQLEnum(ProofType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # File storage (Cloudinary URL or S3 key)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    
    # Optional description
    description = Column(Text, nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="proofs")


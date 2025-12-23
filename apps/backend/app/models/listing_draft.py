"""
Listing Draft Model
Stores draft listing data before final submission.
"""
from sqlalchemy import Column, Integer, ForeignKey, JSON, DateTime, Enum as SQLEnum, String
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Timestamped


class DraftStatus(str, enum.Enum):
    """Draft status"""
    DRAFT = "draft"
    SUBMITTED = "submitted"


class ListingDraft(Timestamped):
    """
    Draft listing data stored as JSONB.
    Only one active draft per seller.
    """
    __tablename__ = "listing_drafts"
    
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, unique=True)
    data = Column(JSON, nullable=False)  # JSONB in PostgreSQL
    step = Column(Integer, default=1, nullable=False)  # Current step (0-3)
    status = Column(SQLEnum(DraftStatus, values_callable=lambda x: [e.value for e in x]), 
                    default=DraftStatus.DRAFT, nullable=False, index=True)
    last_saved_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, onupdate=datetime.utcnow)
    
    # Relationships
    seller = relationship("User", back_populates="listing_draft")
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "seller_id": self.seller_id,
            "data": self.data,
            "step": self.step,
            "status": self.status.value,
            "last_saved_at": self.last_saved_at.isoformat() if self.last_saved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


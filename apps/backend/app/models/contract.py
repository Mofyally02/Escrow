from sqlalchemy import Column, Integer, ForeignKey, Text, String, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Timestamped


class Contract(Timestamped):
    __tablename__ = "contracts"
    
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    
    # PDF contract storage
    pdf_url = Column(String(500), nullable=True)  # Stored in Cloudinary/S3
    pdf_hash = Column(String(64), nullable=False)  # SHA-256 hash for integrity verification
    
    # E-signature (buyer signs by typing full legal name)
    signed_by_name = Column(String(255), nullable=True)  # Buyer's full legal name (must match registration)
    signed_at = Column(String(50), nullable=True)  # ISO timestamp
    
    # Contract metadata
    contract_version = Column(String(20), default="1.0", nullable=False)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="contract")
    
    @property
    def is_signed(self) -> bool:
        """Check if contract is signed"""
        return self.signed_by_name is not None and self.signed_at is not None


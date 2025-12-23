"""
Ownership Transfer Agreement model for STEP 5.
Tracks digital signature with legal name validation.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Timestamped
import hashlib


class OwnershipAgreement(Timestamped):
    """
    Ownership Transfer Agreement signed by buyer.
    Legally binding digital signature with full legal name.
    """
    __tablename__ = "ownership_agreements"
    
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    
    # Agreement content (markdown/HTML)
    agreement_content = Column(Text, nullable=False)  # Full agreement text
    
    # Digital signature
    signed_by_name = Column(String(255), nullable=True)  # Buyer's full legal name (must match user profile)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    signature_hash = Column(String(64), nullable=True)  # SHA-256 hash for integrity verification
    ip_address = Column(String(45), nullable=True)  # IP address at time of signature
    user_agent = Column(Text, nullable=True)  # User agent at time of signature
    
    # Agreement metadata
    agreement_version = Column(String(20), default="1.0", nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=True)  # When agreement becomes effective
    
    # Buyer acknowledgments (explicit checkboxes)
    verified_account_acknowledged = Column(Boolean, default=False, nullable=False)  # "I have verified the account"
    accepts_ownership_acknowledged = Column(Boolean, default=False, nullable=False)  # "I accept full ownership"
    accepts_risks_acknowledged = Column(Boolean, default=False, nullable=False)  # "I accept all risks after transfer"
    platform_liability_ends_acknowledged = Column(Boolean, default=False, nullable=False)  # "Platform liability ends at release"
    
    # Relationships
    transaction = relationship("Transaction", back_populates="ownership_agreement")
    
    @property
    def is_signed(self) -> bool:
        """Check if agreement is fully signed"""
        return (
            self.signed_by_name is not None
            and self.signed_at is not None
            and self.verified_account_acknowledged
            and self.accepts_ownership_acknowledged
            and self.accepts_risks_acknowledged
            and self.platform_liability_ends_acknowledged
        )
    
    def generate_signature_hash(self, buyer_full_name: str, timestamp: str) -> str:
        """Generate SHA-256 hash of signature for integrity verification"""
        signature_string = f"{buyer_full_name}:{timestamp}:{self.transaction_id}:{self.agreement_version}"
        return hashlib.sha256(signature_string.encode('utf-8')).hexdigest()


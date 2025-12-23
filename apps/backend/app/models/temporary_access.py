"""
Temporary Access model for STEP 3.
Tracks limited account access window with security controls.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.models.base import Timestamped


class TemporaryAccess(Timestamped):
    """
    Temporary access granted to buyer for account verification (STEP 3).
    Time-limited with security controls.
    """
    __tablename__ = "temporary_accesses"
    
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False, index=True)
    
    # Access window
    access_granted_at = Column(DateTime(timezone=True), nullable=False)
    access_expires_at = Column(DateTime(timezone=True), nullable=False)  # Typically 24-48 hours
    access_used_at = Column(DateTime(timezone=True), nullable=True)  # First time buyer used access
    
    # Security controls
    login_attempts_count = Column(Integer, default=0, nullable=False)  # Track login attempts
    max_login_attempts = Column(Integer, default=10, nullable=False)  # Maximum allowed attempts
    access_revoked = Column(Boolean, default=False, nullable=False)  # Admin can revoke if suspicious
    
    # Security warnings shown to buyer
    warnings_shown = Column(Boolean, default=False, nullable=False)  # Whether buyer saw security warnings
    warnings_acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Access logs (JSON string for simplicity, or could be separate table)
    access_logs = Column(Text, nullable=True)  # JSON array of access events
    
    # Buyer acknowledgment
    buyer_acknowledged_terms = Column(Boolean, default=False, nullable=False)  # "Do not change account details"
    buyer_acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="temporary_access")
    
    @property
    def is_active(self) -> bool:
        """Check if temporary access is currently active"""
        if self.access_revoked:
            return False
        if self.login_attempts_count >= self.max_login_attempts:
            return False
        now = datetime.utcnow()
        return self.access_granted_at <= now <= self.access_expires_at
    
    @property
    def time_remaining_hours(self) -> float:
        """Get remaining time in hours"""
        if not self.is_active:
            return 0.0
        now = datetime.utcnow()
        remaining = self.access_expires_at - now
        return remaining.total_seconds() / 3600.0


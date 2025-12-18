from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.models.base import Timestamped


class Role(str, enum.Enum):
    """User roles enum"""
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Timestamped):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(Role, values_callable=lambda x: [e.value for e in x]), default=Role.BUYER, nullable=False)
    
    # Verification status
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    
    # Security fields
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    # Specify foreign_keys to disambiguate between seller_id and reviewed_by
    # Listing has both seller_id and reviewed_by FKs to users.id
    # We need to explicitly specify which FK to use for the listings relationship
    listings = relationship(
        "Listing",
        foreign_keys="Listing.seller_id",
        back_populates="seller"
    )
    transactions_as_buyer = relationship("Transaction", foreign_keys="Transaction.buyer_id", back_populates="buyer")
    transactions_as_seller = relationship("Transaction", foreign_keys="Transaction.seller_id", back_populates="seller")
    
    @property
    def is_verified(self) -> bool:
        """Check if both email and phone are verified"""
        return self.is_email_verified and self.is_phone_verified
    
    @property
    def is_account_locked(self) -> bool:
        """Check if account is currently locked"""
        if self.account_locked_until is None:
            return False
        return datetime.utcnow() < self.account_locked_until


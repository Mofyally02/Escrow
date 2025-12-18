from sqlalchemy import Column, Integer, ForeignKey, String, Text, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class AuditAction(str, enum.Enum):
    """Audit action types"""
    # Authentication actions
    REGISTER = "register"
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    EMAIL_VERIFIED = "email_verified"
    PHONE_VERIFIED = "phone_verified"
    OTP_SENT = "otp_sent"
    OTP_VERIFIED = "otp_verified"
    OTP_FAILED = "otp_failed"
    PASSWORD_CHANGED = "password_changed"
    PROFILE_UPDATED = "profile_updated"
    ROLE_CHANGED = "role_changed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    TOKEN_REFRESHED = "token_refreshed"
    TOKEN_REVOKED = "token_revoked"
    
    # Listing actions
    LISTING_CREATED = "listing_created"
    LISTING_SUBMITTED = "listing_submitted"
    LISTING_APPROVED = "listing_approved"
    LISTING_REJECTED = "listing_rejected"
    LISTING_STATE_CHANGED = "listing_state_changed"
    LISTING_VIEWED = "listing_viewed"
    
    # Credential actions
    CREDENTIALS_STORED = "credentials_stored"
    CREDENTIALS_REVEALED = "credentials_revealed"
    CREDENTIALS_VIEWED = "credentials_viewed"
    
    # Admin actions
    ADMIN_REVIEW_STARTED = "admin_review_started"
    ADMIN_REVIEW_COMPLETED = "admin_review_completed"
    ADMIN_REQUEST_INFO = "admin_request_info"
    
    # Transaction actions
    TRANSACTION_INITIATED = "transaction_initiated"
    FUNDS_HELD = "funds_held"
    CONTRACT_GENERATED = "contract_generated"
    CONTRACT_SIGNED = "contract_signed"
    CREDENTIALS_RELEASED = "credentials_released"
    TRANSACTION_COMPLETED = "transaction_completed"
    TRANSACTION_REFUNDED = "transaction_refunded"
    TRANSACTION_DISPUTED = "transaction_disputed"


class AuditLog(Timestamped):
    __tablename__ = "audit_logs"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # Nullable for failed logins
    action = Column(SQLEnum(AuditAction, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # JSON string for additional context
    success = Column(String(10), default="true", nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

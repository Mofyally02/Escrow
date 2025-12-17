from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class OTPType(str, enum.Enum):
    """OTP type enum"""
    EMAIL = "email"
    PHONE = "phone"


class OTPCode(Timestamped):
    __tablename__ = "otp_codes"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    code = Column(String(6), nullable=False)
    otp_type = Column(SQLEnum(OTPType), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="otp_codes")


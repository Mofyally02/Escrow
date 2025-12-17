from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import Timestamped


class RefreshToken(Timestamped):
    __tablename__ = "refresh_tokens"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    device_info = Column(Text, nullable=True)  # User agent, IP, etc.
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

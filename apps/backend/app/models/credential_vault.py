from sqlalchemy import Column, Integer, ForeignKey, Text, String, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Timestamped


class CredentialVault(Timestamped):
    __tablename__ = "credential_vaults"
    
    listing_id = Column(Integer, ForeignKey("listings.id"), unique=True, nullable=False, index=True)
    
    # NEVER store plaintext - AES-256-GCM encrypted
    encrypted_username = Column(Text, nullable=False)
    encrypted_password = Column(Text, nullable=False)
    encrypted_recovery_email = Column(Text, nullable=True)
    encrypted_2fa_secret = Column(Text, nullable=True)
    
    # Encryption metadata (required for AES-256-GCM)
    iv = Column(String(255), nullable=False)  # Initialization vector (base64)
    salt = Column(String(255), nullable=False)  # Salt for Argon2id key derivation (base64)
    tag = Column(String(255), nullable=False)  # GCM authentication tag (base64)
    
    # Key management
    encryption_key_id = Column(String(100), nullable=False)  # Reference to key rotation
    
    # One-time reveal tracking
    revealed_at = Column(DateTime(timezone=True), nullable=True)
    revealed_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="credentials")

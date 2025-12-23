from sqlalchemy import Column, Integer, ForeignKey, String, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class ConfirmationStage(str, enum.Enum):
    """Stages where buyer must provide confirmation"""
    PAYMENT_COMPLETE = "payment_complete"
    CONTRACT_SIGNING = "contract_signing"
    CREDENTIAL_REVEAL = "credential_reveal"
    ACCESS_CONFIRMATION = "access_confirmation"
    TRANSACTION_COMPLETE = "transaction_complete"


class BuyerConfirmation(Timestamped):
    """
    Immutable audit trail of buyer confirmations at each stage.
    Each confirmation includes exact checkbox text, timestamp, IP, and user ID.
    """
    __tablename__ = "buyer_confirmations"
    
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Stage and confirmation details
    stage = Column(SQLEnum(ConfirmationStage, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    confirmation_text = Column(Text, nullable=False)  # Exact checkbox text that was confirmed
    checkbox_label = Column(String(500), nullable=False)  # Human-readable label for the checkbox
    
    # Audit trail
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)  # Browser/client info
    
    # Relationships
    transaction = relationship("Transaction", back_populates="buyer_confirmations")
    buyer = relationship("User", foreign_keys=[buyer_id])


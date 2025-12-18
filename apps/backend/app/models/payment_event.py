"""
Payment event model for tracking webhook events from payment providers.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, Text, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class PaymentEventType(str, enum.Enum):
    """Payment event types from Paystack webhooks"""
    CHARGE_SUCCESS = "charge.success"
    CHARGE_FAILED = "charge.failed"
    TRANSFER_SUCCESS = "transfer.success"
    TRANSFER_FAILED = "transfer.failed"
    AUTHORIZATION = "authorization"
    REFUND = "refund"


class PaymentEvent(Timestamped):
    __tablename__ = "payment_events"
    
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    event_type = Column(SQLEnum(PaymentEventType, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    
    # Paystack event details
    paystack_event_id = Column(String(255), unique=True, nullable=True, index=True)
    paystack_reference = Column(String(255), nullable=True)
    
    # Event payload (full webhook JSON)
    payload = Column(Text, nullable=False)  # JSON string
    
    # Processing status
    processed = Column(Boolean, default=False, nullable=False)
    processed_at = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Webhook verification
    signature_verified = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="payment_events")


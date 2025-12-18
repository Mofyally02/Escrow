from sqlalchemy import Column, Integer, ForeignKey, Numeric, Enum as SQLEnum, String, Text, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class TransactionState(str, enum.Enum):
    """Transaction state machine for escrow flow"""
    PENDING = "pending"  # Payment initiated
    FUNDS_HELD = "funds_held"  # Paystack authorized, manual capture pending
    CONTRACT_SIGNED = "contract_signed"  # Buyer signed contract
    CREDENTIALS_RELEASED = "credentials_released"  # Credentials revealed to buyer
    COMPLETED = "completed"  # Funds released to seller
    REFUNDED = "refunded"  # Funds refunded to buyer
    DISPUTED = "disputed"  # Dispute opened


class Transaction(Timestamped):
    __tablename__ = "transactions"
    
    listing_id = Column(Integer, ForeignKey("listings.id"), unique=True, nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Amount in USD cents
    amount_usd = Column(Integer, nullable=False)
    state = Column(SQLEnum(TransactionState, values_callable=lambda x: [e.value for e in x]), default=TransactionState.PENDING, nullable=False, index=True)
    
    # Paystack details
    paystack_reference = Column(String(255), unique=True, nullable=True, index=True)
    paystack_authorization_code = Column(String(255), nullable=True)
    paystack_customer_code = Column(String(255), nullable=True)
    
    # State timestamps
    funds_held_at = Column(String(50), nullable=True)
    contract_signed_at = Column(String(50), nullable=True)
    credentials_released_at = Column(String(50), nullable=True)
    access_confirmed_at = Column(String(50), nullable=True)  # Buyer confirmed successful login
    completed_at = Column(String(50), nullable=True)
    refunded_at = Column(String(50), nullable=True)
    
    # Buyer confirmation
    buyer_confirmed_access = Column(Boolean, default=False, nullable=False)
    
    # Payout details
    payout_reference = Column(String(255), nullable=True)  # Paystack transfer reference
    commission_usd = Column(Integer, nullable=True)  # Platform commission in USD cents
    payout_amount_usd = Column(Integer, nullable=True)  # Amount to seller after commission
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Relationships
    listing = relationship("Listing", back_populates="transactions")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="transactions_as_buyer")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="transactions_as_seller")
    contract = relationship("Contract", back_populates="transaction", uselist=False)
    payment_events = relationship("PaymentEvent", back_populates="transaction", cascade="all, delete-orphan")
    
    def can_transition_to(self, new_state: "TransactionState") -> bool:
        """Check if state transition is valid"""
        transitions = {
            TransactionState.PENDING: [TransactionState.FUNDS_HELD, TransactionState.REFUNDED],
            TransactionState.FUNDS_HELD: [TransactionState.CONTRACT_SIGNED, TransactionState.REFUNDED, TransactionState.DISPUTED],
            TransactionState.CONTRACT_SIGNED: [TransactionState.CREDENTIALS_RELEASED, TransactionState.REFUNDED, TransactionState.DISPUTED],
            TransactionState.CREDENTIALS_RELEASED: [TransactionState.COMPLETED, TransactionState.DISPUTED],
            TransactionState.COMPLETED: [],  # Terminal state
            TransactionState.REFUNDED: [],  # Terminal state
            TransactionState.DISPUTED: [TransactionState.REFUNDED, TransactionState.COMPLETED]
        }
        return new_state in transitions.get(self.state, [])


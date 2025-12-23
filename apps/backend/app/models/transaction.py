from sqlalchemy import Column, Integer, ForeignKey, Numeric, Enum as SQLEnum, String, Text, Boolean
from sqlalchemy.orm import relationship
import enum
from app.models.base import Timestamped


class TransactionState(str, enum.Enum):
    """Transaction state machine for step-locked buyer purchase flow"""
    # STEP 1: Initiate Purchase
    PURCHASE_INITIATED = "purchase_initiated"  # Buyer clicked "Purchase Account Securely", listing locked
    
    # STEP 2: Payment
    PAYMENT_PENDING = "payment_pending"  # Payment initiated but not completed
    FUNDS_HELD = "funds_held"  # Payment completed, funds secured in escrow
    
    # STEP 3: Temporary Access
    TEMPORARY_ACCESS_GRANTED = "temporary_access_granted"  # Buyer has limited access for verification
    
    # STEP 4: Verification Window
    VERIFICATION_WINDOW = "verification_window"  # Buyer can verify account (24-48 hour window)
    
    # STEP 5: Ownership Agreement
    OWNERSHIP_AGREEMENT_PENDING = "ownership_agreement_pending"  # Waiting for buyer to sign ownership agreement
    OWNERSHIP_AGREEMENT_SIGNED = "ownership_agreement_signed"  # Buyer signed ownership transfer agreement
    
    # STEP 6: Final Confirmation
    FUNDS_RELEASE_PENDING = "funds_release_pending"  # Waiting for final confirmation to release funds
    FUNDS_RELEASED = "funds_released"  # Funds released to seller
    
    # STEP 7: Transaction Closed
    COMPLETED = "completed"  # Transaction fully closed, read-only
    
    # Terminal states
    REFUNDED = "refunded"  # Funds refunded to buyer
    DISPUTED = "disputed"  # Dispute opened
    CANCELLED = "cancelled"  # Transaction cancelled before completion


class Transaction(Timestamped):
    __tablename__ = "transactions"
    
    listing_id = Column(Integer, ForeignKey("listings.id"), unique=True, nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Amount in USD cents
    amount_usd = Column(Integer, nullable=False)
    state = Column(SQLEnum(TransactionState, values_callable=lambda x: [e.value for e in x]), default=TransactionState.PURCHASE_INITIATED, nullable=False, index=True)
    
    # Paystack details
    paystack_reference = Column(String(255), unique=True, nullable=True, index=True)
    paystack_authorization_code = Column(String(255), nullable=True)
    paystack_customer_code = Column(String(255), nullable=True)
    
    # State timestamps (ISO format strings)
    purchase_initiated_at = Column(String(50), nullable=True)  # STEP 1
    payment_pending_at = Column(String(50), nullable=True)
    funds_held_at = Column(String(50), nullable=True)  # STEP 2
    temporary_access_granted_at = Column(String(50), nullable=True)  # STEP 3
    verification_window_started_at = Column(String(50), nullable=True)  # STEP 4
    verification_deadline = Column(String(50), nullable=True)  # Deadline for verification (e.g., 48 hours)
    account_verified_at = Column(String(50), nullable=True)  # Buyer verified account is valid
    ownership_agreement_pending_at = Column(String(50), nullable=True)  # STEP 5
    ownership_agreement_signed_at = Column(String(50), nullable=True)
    funds_release_pending_at = Column(String(50), nullable=True)  # STEP 6
    funds_released_at = Column(String(50), nullable=True)
    completed_at = Column(String(50), nullable=True)  # STEP 7
    refunded_at = Column(String(50), nullable=True)
    cancelled_at = Column(String(50), nullable=True)
    
    # Buyer confirmation
    buyer_confirmed_access = Column(Boolean, default=False, nullable=False)
    account_verified = Column(Boolean, default=False, nullable=False)  # Buyer verified account validity
    
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
    ownership_agreement = relationship("OwnershipAgreement", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    temporary_access = relationship("TemporaryAccess", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    payment_events = relationship("PaymentEvent", back_populates="transaction", cascade="all, delete-orphan")
    buyer_confirmations = relationship("BuyerConfirmation", back_populates="transaction", cascade="all, delete-orphan", order_by="BuyerConfirmation.created_at")
    
    def can_transition_to(self, new_state: "TransactionState") -> bool:
        """
        Check if state transition is valid (step-locked flow).
        Buyer can only move forward one step at a time.
        """
        transitions = {
            # STEP 1: Initiate Purchase
            TransactionState.PURCHASE_INITIATED: [
                TransactionState.PAYMENT_PENDING,
                TransactionState.CANCELLED
            ],
            
            # STEP 2: Payment
            TransactionState.PAYMENT_PENDING: [
                TransactionState.FUNDS_HELD,
                TransactionState.CANCELLED,
                TransactionState.REFUNDED
            ],
            TransactionState.FUNDS_HELD: [
                TransactionState.TEMPORARY_ACCESS_GRANTED,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            
            # STEP 3: Temporary Access
            TransactionState.TEMPORARY_ACCESS_GRANTED: [
                TransactionState.VERIFICATION_WINDOW,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            
            # STEP 4: Verification Window
            TransactionState.VERIFICATION_WINDOW: [
                TransactionState.OWNERSHIP_AGREEMENT_PENDING,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            
            # STEP 5: Ownership Agreement
            TransactionState.OWNERSHIP_AGREEMENT_PENDING: [
                TransactionState.OWNERSHIP_AGREEMENT_SIGNED,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            TransactionState.OWNERSHIP_AGREEMENT_SIGNED: [
                TransactionState.FUNDS_RELEASE_PENDING,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            
            # STEP 6: Final Confirmation
            TransactionState.FUNDS_RELEASE_PENDING: [
                TransactionState.FUNDS_RELEASED,
                TransactionState.REFUNDED,
                TransactionState.DISPUTED
            ],
            TransactionState.FUNDS_RELEASED: [
                TransactionState.COMPLETED
            ],
            
            # STEP 7: Transaction Closed (Terminal)
            TransactionState.COMPLETED: [],  # Terminal state
            TransactionState.REFUNDED: [],  # Terminal state
            TransactionState.CANCELLED: [],  # Terminal state
            
            # Dispute can lead to refund or completion (admin decision)
            TransactionState.DISPUTED: [
                TransactionState.REFUNDED,
                TransactionState.COMPLETED,
                TransactionState.FUNDS_RELEASED  # Admin can force release
            ]
        }
        return new_state in transitions.get(self.state, [])
    
    def get_current_step(self) -> int:
        """Get current step number (1-7)"""
        step_map = {
            TransactionState.PURCHASE_INITIATED: 1,
            TransactionState.PAYMENT_PENDING: 2,
            TransactionState.FUNDS_HELD: 2,
            TransactionState.TEMPORARY_ACCESS_GRANTED: 3,
            TransactionState.VERIFICATION_WINDOW: 4,
            TransactionState.OWNERSHIP_AGREEMENT_PENDING: 5,
            TransactionState.OWNERSHIP_AGREEMENT_SIGNED: 5,
            TransactionState.FUNDS_RELEASE_PENDING: 6,
            TransactionState.FUNDS_RELEASED: 6,
            TransactionState.COMPLETED: 7,
            TransactionState.REFUNDED: 0,  # Terminal
            TransactionState.CANCELLED: 0,  # Terminal
            TransactionState.DISPUTED: 0,  # Special state
        }
        return step_map.get(self.state, 0)
    
    def can_proceed_to_next_step(self) -> bool:
        """Check if all requirements for current step are met"""
        # This will be implemented with step-specific validation
        return True


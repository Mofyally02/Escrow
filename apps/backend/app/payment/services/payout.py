"""
Payout orchestration for escrow completion.
Handles commission calculation and Paystack transfer to seller.
"""
from typing import Tuple, Optional
from app.core.config import settings


class PayoutService:
    """Service for calculating and processing payouts"""
    
    # Platform commission (8-12%, configurable)
    COMMISSION_PERCENTAGE = 10  # 10% default
    
    @staticmethod
    def calculate_commission(amount_usd: int, commission_percent: Optional[int] = None) -> Tuple[int, int]:
        """
        Calculate platform commission and payout amount.
        
        Args:
            amount_usd: Transaction amount in USD cents
            commission_percent: Commission percentage (defaults to COMMISSION_PERCENTAGE)
            
        Returns:
            Tuple of (commission_usd, payout_amount_usd) in cents
        """
        if commission_percent is None:
            commission_percent = PayoutService.COMMISSION_PERCENTAGE
        
        commission_usd = int(amount_usd * commission_percent / 100)
        payout_amount_usd = amount_usd - commission_usd
        
        return commission_usd, payout_amount_usd
    
    @staticmethod
    def get_commission_percentage() -> int:
        """Get configured commission percentage"""
        # Can be overridden by environment variable
        return int(getattr(settings, 'PLATFORM_COMMISSION_PERCENT', PayoutService.COMMISSION_PERCENTAGE))


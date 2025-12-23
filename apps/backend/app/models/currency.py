"""
Currency models and enums for multi-currency support.
"""
import enum
from typing import Dict


class Currency(str, enum.Enum):
    """Supported currencies - Only KSH (Kenyan Shilling)"""
    KSH = "KSH"  # Kenyan Shilling


class CurrencyInfo:
    """Currency information and formatting"""
    
    # Currency symbols
    SYMBOLS: Dict[Currency, str] = {
        Currency.KSH: "KSh",
    }
    
    # Currency names
    NAMES: Dict[Currency, str] = {
        Currency.KSH: "Kenyan Shilling",
    }
    
    # Smallest currency unit
    SMALLEST_UNIT: Dict[Currency, int] = {
        Currency.KSH: 100,  # 1 KSH = 100 cents
    }
    
    @classmethod
    def get_symbol(cls, currency: Currency) -> str:
        """Get currency symbol"""
        return cls.SYMBOLS.get(currency, currency.value)
    
    @classmethod
    def get_name(cls, currency: Currency) -> str:
        """Get currency name"""
        return cls.NAMES.get(currency, currency.value)
    
    @classmethod
    def format_amount(cls, currency: Currency, amount_cents: int) -> str:
        """Format amount with currency symbol"""
        symbol = cls.get_symbol(currency)
        amount = amount_cents / cls.SMALLEST_UNIT[currency]
        return f"{symbol}{amount:,.2f}"


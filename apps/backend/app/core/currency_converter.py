"""
Currency conversion service for multi-currency support.
Handles conversion between KSH, USD, EUR, GBP, and CAD.
"""
from typing import Optional
from app.models.currency import Currency, CurrencyInfo
from app.core.config import settings


class CurrencyConverter:
    """Currency conversion service"""
    
    # Base currency is USD
    # Exchange rates relative to USD (as of 2024, update regularly)
    EXCHANGE_RATES: dict = {
        Currency.USD: 1.0,
        Currency.KSH: 130.0,  # 1 USD = 130 KSH (approximate)
        Currency.EUR: 0.92,    # 1 USD = 0.92 EUR
        Currency.GBP: 0.79,    # 1 USD = 0.79 GBP
        Currency.CAD: 1.35,    # 1 USD = 1.35 CAD
    }
    
    @classmethod
    def get_exchange_rate(cls, from_currency: Currency, to_currency: Currency) -> float:
        """
        Get exchange rate from one currency to another.
        
        Args:
            from_currency: Source currency
            to_currency: Target currency
            
        Returns:
            Exchange rate (amount in to_currency = amount in from_currency * rate)
        """
        if from_currency == to_currency:
            return 1.0
        
        # Convert via USD as base
        from_rate = cls.EXCHANGE_RATES.get(from_currency, 1.0)
        to_rate = cls.EXCHANGE_RATES.get(to_currency, 1.0)
        
        # Rate = (1 / from_rate) * to_rate
        # Example: USD to KSH = (1 / 1.0) * 130.0 = 130.0
        # Example: KSH to USD = (1 / 130.0) * 1.0 = 0.00769
        return (1.0 / from_rate) * to_rate
    
    @classmethod
    def convert(
        cls,
        amount_cents: int,
        from_currency: Currency,
        to_currency: Currency
    ) -> int:
        """
        Convert amount from one currency to another.
        
        Args:
            amount_cents: Amount in smallest unit of from_currency
            from_currency: Source currency
            to_currency: Target currency
            
        Returns:
            Amount in smallest unit of to_currency (rounded)
        """
        if from_currency == to_currency:
            return amount_cents
        
        rate = cls.get_exchange_rate(from_currency, to_currency)
        
        # Convert amount
        # amount_cents is in smallest unit (e.g., cents)
        # We need to convert to main unit, apply rate, then back to smallest unit
        from_smallest_unit = CurrencyInfo.SMALLEST_UNIT[from_currency]
        to_smallest_unit = CurrencyInfo.SMALLEST_UNIT[to_currency]
        
        # Convert to main unit
        amount_main = amount_cents / from_smallest_unit
        
        # Apply exchange rate
        converted_main = amount_main * rate
        
        # Convert back to smallest unit
        converted_cents = int(converted_main * to_smallest_unit)
        
        return converted_cents
    
    @classmethod
    def update_exchange_rate(cls, currency: Currency, rate: float):
        """
        Update exchange rate for a currency (relative to USD).
        
        Args:
            currency: Currency to update
            rate: New exchange rate (1 USD = rate * currency)
        """
        if currency == Currency.USD:
            raise ValueError("Cannot update USD rate (base currency)")
        cls.EXCHANGE_RATES[currency] = rate
    
    @classmethod
    def get_all_rates(cls) -> dict:
        """Get all exchange rates"""
        return cls.EXCHANGE_RATES.copy()


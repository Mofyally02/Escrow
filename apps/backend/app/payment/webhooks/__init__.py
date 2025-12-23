"""
Payment webhook handlers.
"""

from app.payment.webhooks.paystack import router as paystack_webhook_router

__all__ = [
    "paystack_webhook_router",
]


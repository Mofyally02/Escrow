"""
API v1 router - includes all v1 endpoints.
"""
from fastapi import APIRouter
from app.api.v1 import auth, users, listings, admin_listings, catalog, transactions, contracts, credentials
from app.api.v1 import admin_transactions, health

api_router = APIRouter(prefix="/api/v1")

# Include all v1 routers
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/users")
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin_listings.router, prefix="/admin/listings", tags=["admin"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(credentials.router, prefix="", tags=["credentials"])
api_router.include_router(admin_transactions.router, prefix="/admin", tags=["admin"])

# Webhooks (no prefix to match Paystack requirements)
from app.api.v1.webhooks import paystack as paystack_webhook
api_router.include_router(paystack_webhook.router, prefix="/webhooks/paystack", tags=["webhooks"])

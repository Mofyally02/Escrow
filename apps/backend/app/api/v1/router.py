"""
API v1 router - includes all v1 endpoints.
"""
from fastapi import APIRouter
from app.api.v1 import auth, users, listings, admin_listings, catalog, transactions, contracts, credentials, terms
from app.api.v1 import admin_transactions, health, legal, admin_legal, user_acknowledgments, buyer_purchase_flow, seller_sale_flow, listing_drafts

api_router = APIRouter(prefix="/api/v1")

# Include all v1 routers
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(users.router, prefix="/users")
# IMPORTANT: Register listing_drafts BEFORE listings to avoid route conflicts
# /listings/draft/* routes must be checked before /listings/{listing_id}/*
api_router.include_router(listing_drafts.router, prefix="/listings", tags=["listings"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(admin_listings.router, prefix="/admin/listings", tags=["admin"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(credentials.router, prefix="", tags=["credentials"])
api_router.include_router(terms.router, prefix="", tags=["terms"])
api_router.include_router(legal.router, prefix="/legal", tags=["legal"])
api_router.include_router(admin_legal.router, prefix="/admin/legal", tags=["admin"])
api_router.include_router(user_acknowledgments.router, prefix="/acknowledgments", tags=["acknowledgments"])
api_router.include_router(buyer_purchase_flow.router, prefix="", tags=["buyer-purchase"])
api_router.include_router(seller_sale_flow.router, prefix="", tags=["seller-sale"])
api_router.include_router(admin_transactions.router, prefix="/admin", tags=["admin"])

# Webhooks (no prefix to match Paystack requirements)
from app.api.v1.webhooks import paystack as paystack_webhook
api_router.include_router(paystack_webhook.router, prefix="/webhooks/paystack", tags=["webhooks"])

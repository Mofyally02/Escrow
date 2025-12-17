from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1.router import api_router
from app.middleware.security import SecurityHeadersMiddleware, RateLimitHeadersMiddleware
from app.utils.observability import setup_sentry, logger

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ESCROW API",
    description="Freelance Account Marketplace - Escrow Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize observability
setup_sentry()
logger.info(f"Starting ESCROW API in {settings.ENVIRONMENT} mode")

# Security middleware (must be before CORS)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitHeadersMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(api_router)


# Health check endpoints are now in /api/v1/health
# Keeping root health for backward compatibility
@app.get("/health")
async def health_check():
    """Health check endpoint (legacy - use /api/v1/health)"""
    return {
        "status": "ok",
        "service": "backend",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ESCROW API",
        "version": "0.1.0",
        "docs": "/docs",
    }


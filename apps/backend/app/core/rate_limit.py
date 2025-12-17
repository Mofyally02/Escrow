"""
Rate limiting middleware using slowapi
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key from request (IP + endpoint)"""
    endpoint = request.url.path
    ip = get_remote_address(request)
    return f"{ip}:{endpoint}"


# Rate limit decorators
def rate_limit_auth():
    """Rate limit for authentication endpoints"""
    return limiter.limit(f"{settings.RATE_LIMIT_AUTH_PER_MINUTE}/minute")


def rate_limit_general():
    """Rate limit for general endpoints"""
    return limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")


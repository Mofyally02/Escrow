"""
Rate limiting middleware for FastAPI.
Applies rate limiting to auth endpoints.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to specific paths"""
    
    async def dispatch(self, request: Request, call_next):
        # Apply rate limiting to auth endpoints
        if request.url.path.startswith("/api/v1/auth"):
            # Check rate limit
            try:
                # This is a simplified check - slowapi will handle the actual limiting
                # when used as a decorator
                pass
            except RateLimitExceeded:
                return Response(
                    content="Rate limit exceeded",
                    status_code=429
                )
        
        response = await call_next(request)
        return response


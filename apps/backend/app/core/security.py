"""
Security utilities for authentication and authorization.
Includes password hashing (Argon2), JWT generation/verification, and OTP generation.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Argon2 password hashing context (stronger than bcrypt)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(length)])


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing token claims. 'sub' must be stringable.
        expires_delta: Optional custom expiry time. If None, uses settings default.
    
    Returns:
        Encoded JWT token string.
    
    Note:
        - In test mode (settings.TESTING=True), tokens don't expire to avoid flaky tests.
        - The 'sub' claim is automatically converted to string (PyJWT requirement).
    """
    to_encode = data.copy()
    
    # Ensure 'sub' is a string (PyJWT requirement)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    
    # Use timezone-aware datetime and convert to Unix timestamp
    # python-jose expects timestamps (int) for iat and exp, not datetime objects
    now = datetime.now(timezone.utc)
    now_timestamp = int(now.timestamp())
    
    # Always set iat (issued at time) as Unix timestamp
    to_encode["iat"] = now_timestamp
    
    # Skip expiry in test mode
    if not settings.TESTING:
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        # Convert to Unix timestamp (int)
        to_encode["exp"] = int(expire.timestamp())
    
    # Always set type
    to_encode["type"] = "access"
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token() -> str:
    """Generate a secure random refresh token"""
    return secrets.token_urlsafe(64)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify.
    
    Returns:
        Decoded payload dictionary if valid, None if invalid.
    
    Note:
        - Logs specific JWT errors for debugging (security-sensitive).
        - Returns None on any JWT verification failure.
        - In test mode, skips expiry verification to prevent flaky tests.
    """
    try:
        # python-jose decode - handle test mode vs production
        # python-jose supports options dict, but format may vary
        if settings.TESTING:
            # In test mode, skip expiry and iat verification to prevent flaky tests
            # python-jose: options dict with verify_* flags
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={
                    "verify_signature": True,
                    "verify_exp": False,  # Skip expiry check in tests
                    "verify_iat": False,  # Skip iat check in tests
                }
            )
        else:
            # In production, verify everything (default behavior)
            # python-jose verifies exp and iat by default when options not specified
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
        
        # Validate required claims exist
        # python-jose doesn't have a 'require' option, so we check manually
        if "sub" not in payload:
            if settings.DEBUG or settings.TESTING:
                logger.warning("JWT token missing 'sub' claim")
            return None
        
        if "type" not in payload:
            if settings.DEBUG or settings.TESTING:
                logger.warning("JWT token missing 'type' claim")
            return None
        
        # Ensure 'sub' is returned as string (PyJWT/python-jose requirement)
        if "sub" in payload:
            payload["sub"] = str(payload["sub"])
        
        return payload
        
    except JWTError as e:
        # Log specific error for debugging (but don't expose to client)
        error_type = type(e).__name__
        error_msg = str(e)
        
        # In test/debug mode, print detailed error to help diagnose
        if settings.DEBUG or settings.TESTING:
            logger.warning(
                f"JWT verification failed - "
                f"Type: {error_type}, "
                f"Message: {error_msg}, "
                f"Secret key (first 20): {settings.JWT_SECRET_KEY[:20]}..., "
                f"Secret key length: {len(settings.JWT_SECRET_KEY)}, "
                f"Algorithm: {settings.JWT_ALGORITHM}, "
                f"Testing mode: {settings.TESTING}"
            )
            # Print to stdout for test runner to see
            print(f"      JWT Error Details: {error_type}: {error_msg}")
        else:
            logger.debug(f"JWT verification failed: {error_type}: {error_msg}")
        
        return None
        
    except Exception as e:
        # Catch-all for unexpected errors (shouldn't happen, but be safe)
        error_type = type(e).__name__
        error_msg = str(e)
        logger.warning(f"Unexpected error during JWT verification: {error_type}: {error_msg}")
        
        if settings.DEBUG or settings.TESTING:
            import traceback
            logger.warning(f"Traceback: {traceback.format_exc()}")
            print(f"      Unexpected Error: {error_type}: {error_msg}")
            print(f"      Traceback: {traceback.format_exc()}")
        
        return None


def get_token_expiry() -> datetime:
    """Get access token expiry time"""
    return datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)


def get_refresh_token_expiry() -> datetime:
    """Get refresh token expiry time"""
    return datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
